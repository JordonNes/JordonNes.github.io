#!/usr/bin/env python3
"""Build small per-sport display payloads; keep canonical research records intact."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
LEAGUES=['NFL','MLB','NBA','WNBA','NHL','NCAA_Football','NCAA_Basketball','FIBA_Men','FIBA_Women','MMA','Boxing','Tennis','ALL']

def display_record(p):
    # These nested research objects duplicate long histories/feature vectors.
    # The renderer reads only projection and analyst-review information from them.
    q={k:v for k,v in p.items() if k not in ('feature_state','spectrum','provider_offers','sports_game_odds','evaluation_reason','evidence_summary') and not k.startswith('sgo_')}
    feature=p.get('feature_state') or {}; spectrum=p.get('spectrum') or {}
    projection=p.get('player_projection') or spectrum.get('player_projection') or (feature.get('performance') or {}).get('player_projection')
    review=(feature.get('context') or {}).get('analyst_review') or (spectrum.get('jinx_context') or {}).get('analyst_review')
    if projection:q['player_projection']={k:projection[k] for k in ('l5_average','projected_output','line_profile_class','distance_sigma') if k in projection}
    if review:q['feature_state']={'context':{'analyst_review':{k:review[k] for k in ('spy_context_pending','research_expected','fresh_context_available') if k in review}}}
    return q

def build(board,registry,league):
    b={k:v for k,v in board.items() if k not in ('events','game_winner_evaluation')}
    b['events']=[]
    for e in board.get('events',[]):
        if league!='ALL' and e.get('league')!=league:continue
        x=dict(e)
        for k in ('props','game_markets'):x[k]=[display_record(p) for p in e.get(k,[])]
        b['events'].append(x)
    r={k:v for k,v in registry.items() if k!='predictions'}
    r['predictions']=[display_record(p) for p in registry.get('predictions',[]) if league=='ALL' or p.get('league')==league]
    return b,r

def main():
    board=json.loads((DATA/'future_market_board.json').read_text())
    registry=json.loads((DATA/'prediction_registry.json').read_text())
    out=DATA/'dp';out.mkdir(parents=True,exist_ok=True)
    sizes={}
    for league in LEAGUES:
        b,r=build(board,registry,league)
        text='/* Generated sport display data; research history stays in canonical JSON. */\nwindow.LJ_FUTURE_MARKET_BOARD='+json.dumps(b,ensure_ascii=False,separators=(',',':'))+';\nwindow.LSI_PR='+json.dumps(r,ensure_ascii=False,separators=(',',':'))+';\n'
        size=len(text.encode());sizes[league]=size
        if size>5*1024*1024:raise SystemExit(f'{league} DP payload exceeds 5 MiB budget: {size}')
        p=out/(league+'.js');tmp=p.with_suffix('.js.tmp');tmp.write_text(text,encoding='utf-8');tmp.replace(p)
    print('DP display bytes:',sizes)
if __name__=='__main__':main()
