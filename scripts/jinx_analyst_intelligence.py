#!/usr/bin/env python3
"""JINX Analyst Desk: fresh narrative/context intelligence for current POM players.

Purpose:
- keep JINX aware of credible developing information around key players/teams;
- prioritize quarterbacks, heavily offered players, injury/role changes and noisy situations;
- digest attributable headlines/descriptions from free public ESPN news plus durable
  RotoWire/ESPN context already collected by LSI;
- never infer motivation, contract pressure, locker-room conflict or causation from
  statistics alone;
- never create a POM or directly change LJPC. Spectrum may use this dossier as a
  review requirement / confidence guard, while directional changes still require
  structured evidence.

The output is deliberately compact and source-attributable so the same evidence can
be reused by Spectrum, I Spy and future analyst displays without repeated research.
"""
from __future__ import annotations

import csv
import json
import math
import re
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
BOARD=DATA/"qc_prop_board.json"
FUTURE=DATA/"future_market_board.json"
ROTO=DATA/"rotowire_context.csv"
ESPN_CONTEXT=DATA/"espn_context.csv"
PLAYER_REG=DATA/"espn_player_registry.json"
OUT=DATA/"jinx_analyst_context.json"
NOW=datetime.now(timezone.utc)

UA={"User-Agent":"LEGZ-JINX-AnalystDesk/1.0","Accept":"application/json,text/plain,*/*"}
ROUTES={
 "NFL":("football","nfl"),
 "NCAA_Football":("football","college-football"),
 "NBA":("basketball","nba"),
 "WNBA":("basketball","wnba"),
 "NCAA_Basketball":("basketball","mens-college-basketball"),
 "MLB":("baseball","mlb"),
 "NHL":("hockey","nhl"),
}
KEY_POSITIONS={"QB":30,"RB":14,"WR":14,"TE":12,"PG":14,"SG":12,"SF":11,"PF":11,"C":11,"P":8,"SP":12,"RP":8,"G":8}
TOPIC_RULES={
 "INJURY_HEALTH":("injur","practice","questionable","doubtful","limited","inactive","healthy","cleared","return"),
 "ROLE_USAGE":("starter","starting","bench","role","depth chart","snap","target","touch","usage","rotation"),
 "CONTRACT_BUSINESS":("contract","extension","salary","guarantee","free agent","option","restructure","holdout"),
 "TRANSACTION":("trade","traded","waiv","released","signed","acquired","roster move"),
 "COACHING_GAMEPLAN":("coach","game plan","gameplan","scheme","play-call","play call","offense","defense","coverage"),
 "DISCIPLINE_AVAILABILITY":("suspend","disciplin","inactive","personal conduct"),
 "PERFORMANCE_RESPONSE":("bounce back","respond","response","struggle","slump","improve","adjust","fix","turnaround"),
}

def clean(v):return re.sub(r"\s+"," ",str(v or "")).strip()
def norm(v):return re.sub(r"[^a-z0-9]+"," ",clean(v).lower()).strip()
def parse_dt(v):
    if not v:return None
    try:
        x=datetime.fromisoformat(str(v).replace("Z","+00:00"))
        return x if x.tzinfo else x.replace(tzinfo=timezone.utc)
    except ValueError:return None
def load_json(path,default):
    try:return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError,json.JSONDecodeError,OSError):return default
def get_json(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=20) as response:
        return json.load(response)

def active_events():
    payload=load_json(BOARD,{"events":[]})
    if not payload.get("events"):
        payload=load_json(FUTURE,{"events":[]})
    return payload.get("events") or []

def player_registry():
    payload=load_json(PLAYER_REG,{"players":[]})
    out={}
    for row in payload.get("players") or []:
        league=clean(row.get("league"));name=norm(row.get("name"))
        if league and name:
            out[(league,name)]={"team":clean(row.get("team")),"position":clean(row.get("position")),"espn_id":clean(row.get("espn_id"))}
    return out

def current_subjects():
    reg=player_registry();subjects={};team_events=defaultdict(list)
    for event in active_events():
        league=clean(event.get("league"));away=clean(event.get("away"));home=clean(event.get("home"))
        event_id=clean(event.get("event_id") or event.get("source_event_id"))
        start=clean(event.get("commence_time") or event.get("event_start_pt"))
        for team in (away,home):
            if team:team_events[(league,norm(team))].append({"event_id":event_id,"start":start,"away":away,"home":home})
        counts=Counter(norm(p.get("participant")) for p in (event.get("props") or []) if p.get("participant"))
        display={}
        for p in event.get("props") or []:
            name=clean(p.get("participant"))
            if not name:continue
            display[norm(name)]=name
        for key,count in counts.items():
            meta=reg.get((league,key),{})
            subjects[(league,key)]={
              "league":league,"player":display.get(key,key.title()),"player_key":key,
              "team":meta.get("team") or "","position":meta.get("position") or "",
              "espn_id":meta.get("espn_id") or "","market_count":count,
              "event_id":event_id,"event_start":start,"away":away,"home":home,
            }
    return subjects

def topics(text):
    blob=norm(text);out=[]
    for label,tokens in TOPIC_RULES.items():
        if any(token in blob for token in tokens):out.append(label)
    return out

def espn_articles(leagues):
    out=[]
    for league in sorted(leagues):
        route=ROUTES.get(league)
        if not route:continue
        sport,slug=route
        url=f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{slug}/news?limit=100"
        try:payload=get_json(url)
        except (urllib.error.URLError,urllib.error.HTTPError,TimeoutError,json.JSONDecodeError) as exc:
            print(f"WARN JINX Analyst ESPN news {league}: {exc}");continue
        for a in payload.get("articles") or []:
            if not isinstance(a,dict):continue
            headline=clean(a.get("headline"));description=clean(a.get("description"))
            if not headline:continue
            links=a.get("links") or {}
            web=(links.get("web") or {}) if isinstance(links,dict) else {}
            link=clean(web.get("href") if isinstance(web,dict) else "")
            published=clean(a.get("published") or a.get("lastModified") or "")
            cats=[]
            for c in a.get("categories") or []:
                if isinstance(c,dict):
                    cats.extend([clean(c.get("description")),clean(c.get("teamId")),clean(c.get("athleteId"))])
            out.append({"source":"ESPN_PUBLIC_NEWS","league":league,"headline":headline,"summary":description[:700],
                        "published_at":published,"url":link,"categories":[x for x in cats if x],"topics":topics(headline+" "+description)})
    return out

def durable_context():
    out=[]
    for path,source in ((ROTO,"ROTOWIRE_CONTEXT"),(ESPN_CONTEXT,"ESPN_CONTEXT")):
        if not path.exists():continue
        try:
            with path.open(newline="",encoding="utf-8-sig") as fh:
                for r in csv.DictReader(fh):
                    league=clean(r.get("league") or r.get("sport"))
                    player=clean(r.get("player") or r.get("participant"))
                    team=clean(r.get("team"))
                    headline=clean(r.get("headline") or r.get("evidence_summary"))
                    stamp=clean(r.get("published_at") or r.get("retrieved_at") or r.get("collected_at_pt"))
                    if not (league and (player or team) and headline):continue
                    out.append({"source":source,"league":league,"player":player,"team":team,"headline":headline,
                                "summary":clean(r.get("evidence_summary"))[:700],"published_at":stamp,
                                "url":clean(r.get("source_url")),"topics":topics(headline+" "+clean(r.get("evidence_summary"))),
                                "status":clean(r.get("player_status") or r.get("availability")),
                                "severity":clean(r.get("context_severity"))})
        except (OSError,UnicodeDecodeError):continue
    return out

def article_age_hours(a):
    stamp=parse_dt(a.get("published_at"))
    return (NOW-stamp.astimezone(timezone.utc)).total_seconds()/3600 if stamp else None

def relevant_articles(subject,news,contexts):
    pk=subject["player_key"];team=norm(subject.get("team"));league=subject["league"]
    rows=[]
    for a in news:
        if a.get("league")!=league:continue
        blob=norm((a.get("headline") or "")+" "+(a.get("summary") or "")+" "+" ".join(a.get("categories") or []))
        player_hit=bool(pk and pk in blob)
        team_hit=bool(team and team in blob)
        if not player_hit and not team_hit:continue
        age=article_age_hours(a)
        if age is not None and age>168:continue
        x=dict(a);x["match_type"]="PLAYER" if player_hit else "TEAM";x["age_hours"]=round(age,1) if age is not None else None
        rows.append(x)
    for a in contexts:
        if a.get("league")!=league:continue
        player_hit=pk==norm(a.get("player"))
        team_hit=bool(team and team==norm(a.get("team")))
        if not player_hit and not team_hit:continue
        age=article_age_hours(a)
        if age is not None and age>168:continue
        x=dict(a);x["match_type"]="PLAYER" if player_hit else "TEAM";x["age_hours"]=round(age,1) if age is not None else None
        rows.append(x)
    dedup={}
    for x in rows:
        key=(norm(x.get("headline")),x.get("source"))
        prior=dedup.get(key)
        if prior is None or (x.get("age_hours") or 9999)<(prior.get("age_hours") or 9999):dedup[key]=x
    return sorted(dedup.values(),key=lambda x:(x.get("age_hours") is None,x.get("age_hours") or 0))[:12]

def priority(subject,articles):
    score=0;flags=[]
    pos=subject.get("position","").upper()
    if pos in KEY_POSITIONS:
        score+=KEY_POSITIONS[pos]
        if pos=="QB":flags.append("KEY_QUARTERBACK")
        else:flags.append("KEY_PLAYER")
    market_count=int(subject.get("market_count") or 0)
    score+=min(25,market_count*3)
    if market_count>=4:flags.append("HEAVY_POM_EXPOSURE")
    player_news=sum(1 for a in articles if a.get("match_type")=="PLAYER")
    team_news=sum(1 for a in articles if a.get("match_type")=="TEAM")
    score+=min(20,player_news*6)+min(10,team_news*2)
    all_topics={t for a in articles for t in (a.get("topics") or [])}
    if "INJURY_HEALTH" in all_topics:score+=12;flags.append("HEALTH_CONTEXT")
    if "ROLE_USAGE" in all_topics:score+=10;flags.append("ROLE_CONTEXT")
    if "CONTRACT_BUSINESS" in all_topics:score+=6;flags.append("CONTRACT_CONTEXT_REPORTED")
    if "TRANSACTION" in all_topics:score+=8;flags.append("TRANSACTION_CONTEXT")
    if "COACHING_GAMEPLAN" in all_topics:score+=8;flags.append("GAMEPLAN_CONTEXT")
    if "PERFORMANCE_RESPONSE" in all_topics:score+=8;flags.append("RESPONSE_CONTEXT")
    score=min(100,score)
    if score>=45:flags.append("ANALYST_REVIEW_REQUIRED")
    return score,list(dict.fromkeys(flags))

def main():
    subjects=current_subjects()
    leagues={x["league"] for x in subjects.values()}
    news=espn_articles(leagues);contexts=durable_context()
    dossiers=[]
    for subject in subjects.values():
        articles=relevant_articles(subject,news,contexts)
        score,flags=priority(subject,articles)
        topic_counts=Counter(t for a in articles for t in (a.get("topics") or []))
        contract_mentions=[a for a in articles if "CONTRACT_BUSINESS" in (a.get("topics") or [])]
        dossier={**subject,
          "priority_score":score,"flags":flags,"review_required":"ANALYST_REVIEW_REQUIRED" in flags,
          "fresh_context_count":len(articles),"player_article_count":sum(a.get("match_type")=="PLAYER" for a in articles),
          "team_article_count":sum(a.get("match_type")=="TEAM" for a in articles),
          "topics":dict(topic_counts),"articles":articles,
          "contract_context":{"reported":bool(contract_mentions),"evidence":[{"headline":a.get("headline"),"source":a.get("source"),"url":a.get("url")} for a in contract_mentions[:3]]},
          "policy":"Narrative evidence is attributable context. Motivation/contract pressure is never inferred merely because performance is below average."
        }
        dossiers.append(dossier)
    dossiers.sort(key=lambda x:(x.get("priority_score",0),x.get("market_count",0)),reverse=True)
    payload={
      "schema_version":"JINX-ANALYST-CONTEXT-1","generated_at_utc":NOW.isoformat(),
      "source_policy":"ESPN public news + durable RotoWire/ESPN context. Headlines/descriptions are evidence, not automatic directional truth.",
      "review_policy":"Key/volatile players should not receive high-confidence streak-following conclusions without fresh contextual review; Spectrum supplies the volatility/rebound guard separately.",
      "active_players":len(dossiers),"espn_news_items":len(news),"durable_context_items":len(contexts),"dossiers":dossiers[:250]
    }
    OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"JINX Analyst Desk: active={len(dossiers)} review_required={sum(x.get('review_required') for x in dossiers)} news={len(news)} context={len(contexts)}")

if __name__=="__main__":main()
