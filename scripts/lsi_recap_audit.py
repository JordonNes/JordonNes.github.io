"""Compact, filterable publication audit. Never infer a result from a projection.

Inputs remain the immutable publication ledger and verified settlement CSV.
QC snapshot text is retained even when no exact structured leg can be matched.
"""
import json
import re
from collections import defaultdict
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

PT = ZoneInfo('America/Los_Angeles')


def number(value):
    try:
        n = float(value)
        return n if n == n and abs(n) != float('inf') else None
    except (TypeError, ValueError):
        return None


def normalize(value):
    return re.sub(r'[^a-z0-9]+', ' ', str(value or '').lower()).strip()


def read(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding='utf-8'))


def date_pt(raw):
    try:
        return datetime.fromisoformat(str(raw).replace('Z', '+00:00')).astimezone(PT).date().isoformat()
    except (ValueError, TypeError):
        return ''


def season(league, date):
    try:
        y, m = map(int, str(date)[:7].split('-'))
    except (ValueError, TypeError):
        return 'UNKNOWN'
    if league in {'NBA', 'NHL', 'NCAA_Basketball'}:
        start = y if m >= 7 else y - 1
        return f'{start}-{str(start+1)[2:]}'
    # January/February NFL/CFB postseason belongs to the previous season.
    if league in {'NFL', 'NCAA_Football'} and m <= 2:
        y -= 1
    return str(y)


def result_grade(row, result):
    if row.get('capture_validity') != 'VALID' or row.get('accuracy_eligible') is not True:
        return 'UNGRADED'
    return {'WIN': 'HIT', 'LOSS': 'MISS', 'HIT': 'HIT', 'MISS': 'MISS',
            'VOID': 'VOID', 'PUSH': 'PUSH'}.get(str((result or {}).get('grade', '')).upper(), 'UNGRADED')


def ticket_grade(grades):
    if 'MISS' in grades:
        return 'MISS'
    if not grades or 'UNGRADED' in grades:
        return 'UNGRADED'
    if all(g in {'PUSH', 'VOID'} for g in grades):
        return 'VOID'
    return 'HIT'


def stat(rows):
    h = sum(r['grade'] == 'HIT' for r in rows)
    m = sum(r['grade'] == 'MISS' for r in rows)
    return {'published': len(rows), 'hits': h, 'misses': m,
            'ungraded': sum(r['grade'] == 'UNGRADED' for r in rows),
            'push_void': sum(r['grade'] in {'PUSH', 'VOID'} for r in rows),
            'accuracy': round(100*h/(h+m), 2) if h+m else None}


def unique_rows(rows):
    # One event/player/market/side/threshold, regardless of placement, date,
    # price or confidence refresh. Different thresholds remain separate calls.
    chosen = {}
    for r in rows:
        old = chosen.get(r['outcome'])
        if old is None or (old['grade'] == 'UNGRADED' and r['grade'] != 'UNGRADED'):
            chosen[r['outcome']] = r
    return list(chosen.values())



def market_type(raw):
    n = normalize(raw)
    n = re.sub(r'^player ', '', n)
    aliases = {
        'pass yds': 'Passing yards', 'passing yards': 'Passing yards',
        'rush yds': 'Rushing yards', 'rushing yards': 'Rushing yards',
        'reception yds': 'Receiving yards', 'receiving yards': 'Receiving yards',
        'pass tds': 'Passing touchdowns', 'passing touchdowns': 'Passing touchdowns',
        'rush tds': 'Rushing touchdowns', 'rushing touchdowns': 'Rushing touchdowns',
        'reception tds': 'Receiving touchdowns', 'receiving touchdowns': 'Receiving touchdowns',
        'anytime td': 'Anytime touchdown', 'touchdown scorer': 'Anytime touchdown',
        'receptions': 'Receptions', 'points': 'Points', 'assists': 'Assists',
        'rebounds': 'Rebounds', 'points rebounds assists': 'Points + rebounds + assists',
        'pra': 'Points + rebounds + assists', 'threes': 'Three-pointers',
        'three pointers made': 'Three-pointers', '3 pointers': 'Three-pointers',
        'pass interceptions': 'Passing interceptions', 'passing interceptions': 'Passing interceptions',
    }
    return aliases.get(n, str(raw or 'Unstructured market'))


def build(root, suggestions, results, sports):
    now = datetime.now(PT)
    target = (now.date()-timedelta(days=1)).isoformat()
    data = root/'data'
    out = data/'recaps'
    out.mkdir(parents=True, exist_ok=True)
    players = read(data/'espn_player_registry.json', {}).get('players', [])
    identities = defaultdict(set)
    for p in players:
        if p.get('team'):
            identities[(p.get('league'), normalize(p.get('name')))].add(p['team'])
    rows_by_league = defaultdict(list)
    by_id = {}
    exact = defaultdict(list)
    settled_outcomes = {}
    def outcome_key(s):
        return (s.get('league'), str(s.get('event_id') or ''), normalize(s.get('participant')),
                normalize(s.get('market')), str(s.get('side') or '').upper(), number(s.get('threshold')))
    for s in suggestions:
        r = results.get(s.get('suggestion_id'))
        if r and s.get('event_id') and result_grade(s, r) != 'UNGRADED':
            settled_outcomes.setdefault(outcome_key(s), r)
    for s in suggestions:
        league = s.get('league')
        if league not in sports:
            continue
        sid = s.get('suggestion_id')
        if not sid:
            continue
        result = results.get(sid) or (settled_outcomes.get(outcome_key(s)) if s.get('event_id') else None) or {}
        g = result_grade(s, result)
        actual = number(result.get('actual_result')) if g != 'UNGRADED' else None
        day = s.get('publication_date_pt') or date_pt(s.get('first_seen_at_utc'))
        event_day = date_pt(s.get('event_start_pt')) or day
        team = s.get('player_team') or s.get('team') or ''
        team_source = 'PUBLICATION' if team else 'UNRESOLVED'
        # Current rosters are supporting identity evidence, never an assertion
        # of historical membership. Use only one candidate in the archived game.
        if not team and s.get('market_class') == 'PLAYER_PROP':
            candidates = identities.get((league, normalize(s.get('participant'))), set())
            sides = [normalize(s.get('away')), normalize(s.get('home'))]
            matched = [t for t in candidates if any(side and (side == normalize(t) or
                       (len(side) > 3 and side in normalize(t)) or
                       (side.split() and len(side.split()[-1]) >= 4 and side.split()[-1] == normalize(t).split()[-1])) for side in sides)]
            if len(matched) == 1:
                team = matched[0]
                team_source = 'ROSTER_MATCHED_TO_ARCHIVED_MATCHUP'
        raw = str(s.get('display_text') or s.get('selection') or '')
        projection = s.get('projection')
        if projection is None:
            match = re.search(r'L&J PROJ\s*([-+]?\d+(?:\.\d+)?)', raw, re.I)
            projection = number(match.group(1)) if match else None
        threshold = number(s.get('threshold'))
        # YES / NO milestone and alternate lines are not sportsbook central
        # estimates. Only explicit standard O/U quotes qualify for line bias.
        side = str(s.get('side') or '').upper()
        standard = side in {'OVER', 'UNDER', 'MORE', 'LESS'} and str(s.get('pom_type') or 'NORMAL').upper() not in {'DEMON', 'GOBLIN', 'TROLL', 'AGGRESSIVE', 'SNS'}
        book = str(s.get('book') or '')
        market_error = actual-threshold if (actual is not None and threshold is not None and standard and book and 'synthetic' not in book.lower()) else None
        row = {'id': sid, 'league': league, 'date': day, 'season': season(league, event_day),
               'event': str(s.get('event_id') or ''), 'event_start': s.get('event_start_pt'),
               'matchup': ' @ '.join(str(s.get(x)) for x in ('away', 'home') if s.get(x)) or str(s.get('event_id') or 'Unresolved event'),
               'player': s.get('participant') or 'Unresolved participant', 'team': team or 'Unassigned team',
               'team_source': team_source, 'market_class': s.get('market_class') or '',
               'market_label': s.get('market') or 'Unstructured market', 'market': market_type(s.get('market')), 'side': side, 'line': threshold,
               'book': book, 'price': s.get('price'), 'ljpc': number(s.get('ljpc')),
               'legz': number(s.get('legz_confidence')), 'projection': number(projection),
               'placements': s.get('placements') or [], 'text': raw,
               'grade': g, 'actual': actual, 'source': result.get('source') if g != 'UNGRADED' else '',
               'settled_at': result.get('settled_at_pt') if g != 'UNGRADED' else '',
               'reason': '' if g != 'UNGRADED' else (s.get('quarantine_reason') or s.get('capture_validity') if s.get('capture_validity') != 'VALID' else 'No verified final settlement'),
               'market_error': market_error,
               'projection_error': actual-number(projection) if actual is not None and number(projection) is not None else None,
               'outcome': '|'.join(str(v or '') for v in (league, s.get('event_id') or sid, normalize(s.get('participant')), s.get('market_class'), normalize(s.get('market')), side, threshold))}
        rows_by_league[league].append(row)
        by_id[sid] = row
        exact[(league, str(s.get('event_id') or ''), normalize(raw))].append(row)

    cards_by_league = defaultdict(list)
    cards = read(data/'qc_card_ledger.json', {}).get('cards', [])
    card_ticket_keys = set()
    for card in cards:
        league = card.get('league')
        if league not in sports:
            continue
        groups = []
        for group in card.get('groups', []):
            legs = []
            for leg in group.get('legs', []):
                row = by_id.get(leg.get('suggestion_id'))
                legs.append({'id': leg.get('suggestion_id'), 'text': leg.get('text', ''),
                             'grade': row['grade'] if row else 'UNGRADED',
                             'actual': row['actual'] if row else None})
            groups.append({'name': group['name'], 'legs': legs,
                           'grade': ticket_grade([l['grade'] for l in legs])})
            card_ticket_keys.add((league, card.get('date'), str(card.get('event_id') or ''), group['name'], tuple(normalize(l['text']) for l in legs)))
        cards_by_league[league].append({**card, 'groups': groups})

    # Legacy tickets preserve exact card contents, but cannot prove Hot Top /
    # winner columns that were not in that ticket snapshot. Never fabricate them.
    legacy = read(data/'qc_ticket_registry.json', {}).get('tickets', [])
    seen = set()
    for t in legacy:
        league = t.get('league')
        if league not in sports:
            continue
        day = t.get('publication_date_pt') or date_pt(t.get('captured_at_utc'))
        event = str(t.get('event_id') or '')
        texts = t.get('legs') or []
        key = (league, day, event, t.get('tier'), tuple(normalize(x) for x in texts))
        if key in seen or key in card_ticket_keys:
            continue
        seen.add(key)
        legs = []
        for text in texts:
            candidates = [r for r in exact.get((league, event, normalize(text)), []) if r['date'] == day]
            # Never grade a leg against a merely similar current market.
            grades = {r['grade'] for r in candidates}
            row = candidates[0] if candidates and len(grades) == 1 else None
            legs.append({'id': row['id'] if row else None, 'text': text,
                         'grade': row['grade'] if row else 'UNGRADED', 'actual': row['actual'] if row else None})
        cards_by_league[league].append({'id': t.get('ticket_id'), 'date': day, 'league': league,
             'event_id': event, 'matchup': ' @ '.join(str(t.get(k)) for k in ('away', 'home') if t.get(k)) or event,
             'legacy': True, 'groups': [{'name': t.get('tier') or 'QC', 'legs': legs, 'grade': ticket_grade([l['grade'] for l in legs])}]})

    manifest = {'schema_version': 'LJ-RECAP-AUDIT-1', 'generated_at': now.isoformat(), 'previous_day': target,
                'policy': 'Hit rate = hits / (hits + misses). Primary accuracy counts unique event/player/market/side/threshold outcomes once. Every publication version remains visible. Push, void and ungraded are excluded.',
                'sports': {}}
    for league, info in sports.items():
        rows = rows_by_league[league]
        cs = cards_by_league[league]
        current_season = season(league, now.date().isoformat())
        payload = {'schema_version': 'LJ-RECAP-AUDIT-1', 'league': league,
                   'rows': rows, 'cards': cs,
                   'coverage': {'latest_pom_capture': max((r['date'] for r in rows if r['market_class'] == 'PLAYER_PROP'), default=None),
                      'last_twenty_capture': max((r['date'] for r in rows if 'TWENTY_PIECE' in r['placements']), default=None),
                      'legacy_qc_note': 'Legacy QC snapshots preserve ticket legs only; absent winner / Hot Top columns are not reconstructed. Missing historical 20 Piece publications cannot be inferred from QC contents.'}}
        write(out/f'{league}.json', payload)
        manifest['sports'][league] = {'label': info[0], 'file': f'data/recaps/{league}.json',
            'current_season': current_season, 'seasons': sorted({r['season'] for r in rows} | {current_season}, reverse=True),
            'dates': sorted({r['date'] for r in rows} | {c['date'] for c in cs}, reverse=True),
            'season_props': stat(unique_rows([r for r in rows if r['season'] == current_season and r['market_class'] == 'PLAYER_PROP'])),
            'coverage': payload['coverage']}
    write(out/'index.json', manifest)
    return manifest


def write(path, payload):
    text = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))+'\n'
    if not path.exists() or path.read_text(encoding='utf-8') != text:
        path.write_text(text, encoding='utf-8')
