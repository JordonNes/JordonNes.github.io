"""Publish recent player box-score averages for the schedule-bound QC pages."""
import csv
import json
import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone

BASKETBALL = ('points', 'rebounds', 'assists', 'threes_made')
FOOTBALL = ('pass_yards', 'rush_yards', 'receiving_yards', 'receptions')
METRICS = {'NBA': BASKETBALL, 'NCAA_Basketball': BASKETBALL, 'NFL': FOOTBALL,
           'NCAA_Football': FOOTBALL, 'NHL': ('shots_on_goal', 'points', 'saves')}


def publish(data):
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=45)).isoformat()[:10]
    series = defaultdict(dict)
    current_team = {}
    with (data / 'performance_history.csv').open(encoding='utf-8') as source:
        for row in csv.DictReader(source):
            league, metric, date = (row[k] for k in ('league', 'metric', 'event_start_utc'))
            if metric not in METRICS.get(league, ()) or date[:10] < cutoff or date[:10] > now.date().isoformat():
                continue
            expected_source = 'NHL_WEB_PLAYER_GAME_LOG' if league == 'NHL' else 'ESPN_PUBLIC_BOX_SCORE'
            if row['source'] != expected_source or not row['team'] or not row['provider_player_id']:
                continue
            player = (league, row['provider_player_id'])
            team = row['team']
            if date > current_team.get(player, ('', ''))[0]:
                current_team[player] = (date, team)
            try:
                value = float(row['value'])
            except ValueError:
                continue
            if math.isfinite(value):
                series[player, team, row['participant'], metric][date] = value
    teams = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for (player, team, name, metric), games in series.items():
        dates = sorted(games, reverse=True)[:5]
        if len(dates) < 3 or team != current_team[player][1] or dates[0][:10] < (now - timedelta(days=14)).date().isoformat():
            continue
        mean = round(sum(games[d] for d in dates) / len(dates), 1)
        if mean > 0:
            teams[player[0]][team][metric].append([name, mean, len(dates), dates[0][:10]])
    for league in METRICS:
        output = {team: {metric: sorted(players, key=lambda p: (-p[1], p[0]))[:2]
                         for metric, players in metrics.items()} for team, metrics in teams[league].items()}
        path = data / 'dp' / (league + '-forecasts.json')
        path.write_text(json.dumps({'generated_at': now.isoformat(), 'teams': output},
                                   separators=(',', ':')), encoding='utf-8')
