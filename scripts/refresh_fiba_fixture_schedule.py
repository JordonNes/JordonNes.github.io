#!/usr/bin/env python3
"""Refresh LJDP FIBA fixture snapshots from official FIBA competition pages.

Strict ingestion:
  * FIBA pages are authoritative for match identity and schedule only, not odds.
  * When source parsing fails or fewer than 10 fixtures remain, do NOT overwrite
    the last good snapshot. Its browser freshness warning will remain visible.
  * Never populate LJPC, sides, thresholds, price or scores here.
  * Official page display clocks are not assumed to be UTC or Pacific.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"data/fiba_verified_fixtures.js"
SOURCES={
    ("men","FIBA Europe Cup"):"https://www.fiba.basketball/en/events/fiba-europe-cup-26-27",
    ("women","EuroCup Women"):"https://www.fiba.basketball/en/events/eurocup-women-26-27",
    ("women","EuroLeague Women"):"https://www.fiba.basketball/en/events/euroleague-women-26-27",
}
MONTHS={v:i for i,v in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(),1)}
# Official FIBA schedule markup repeats each team's shortcode in text.
# Do not guess teams from locations or unrelated page text.
GAME_RE=re.compile(
  r"(?:Regular\s+Season(?:\s*-\s*First\s+Round)?\s*[·\-]\s*"
  r"(?:Group\s+(?P<group>[A-Z])|First\s+Round(?:\s*[·\-]\s*Group\s+(?P<group2>[A-Z]))?)\s+)"
  r"(?P<home>[A-Z0-9]{2,10})\s+(?P=home)\s+"
  r"(?P<away>[A-Z0-9]{2,10})\s+(?P=away)\s+"
  r".{0,115}?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+"
  r"(?P<month>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+"
  r"(?P<day>\d{1,2})\s+(?P<clock>\d{1,2}:\d{2})\b",re.I
)

def parse_fixtures(text,track,comp,source,clock_date):
    cleaned=re.sub(r"\s+"," ",text).strip()
    found=[]
    for m in GAME_RE.finditer(cleaned):
        y=clock_date.year
        mon=MONTHS[m["month"].title()]
        if clock_date.month>=10 and mon<=3:
            y+=1
        try:d=date(y,mon,int(m["day"]))
        except ValueError:continue
        if d<clock_date or d>clock_date+timedelta(days=45):continue
        home,away=m["home"].upper(),m["away"].upper()
        if home==away:continue
        ident="FIBA-"+d.isoformat()+"-"+re.sub(r"\W","",comp).upper()+"-"+home+"-"+away
        found.append({
            "id":ident,"track":track,"competition":comp,"date":d.isoformat(),
            "publishedTime":m["clock"],"timeZone":"FIBA_SITE_DISPLAY_NOT_INDEPENDENTLY_VERIFIED",
            "home":home,"away":away,"group":(m["group"] or m["group2"] or "?").upper(),
            "source":source,"evidence":"OFFICIAL_FIBA_FIXTURE_LIST","marketStatus":"NOT_VERIFIED"
        })
    return list({e["id"]:e for e in found}.values())

def acquire(url):
    request=urllib.request.Request(url,headers={
      "User-Agent":"Mozilla/5.0 (compatible; LJDP-FIBA-ScheduleAudit/1.0; verified public schedule)",
      "Accept":"text/html,application/xhtml+xml"})
    with urllib.request.urlopen(request,timeout=35) as resp:
        final_url=resp.geturl()
        if not final_url.startswith("https://www.fiba.basketball/"):
            raise ValueError("Unexpected redirect: "+final_url)
        raw=resp.read(7_000_000).decode("utf-8","replace")
    soup=BeautifulSoup(raw,"html.parser")
    for tag in soup(["script","style","noscript"]):
        tag.decompose()
    return soup.get_text(" ",strip=True)

def run():
    clock_date=datetime.now(ZoneInfo("America/Los_Angeles")).date()
    override=os.getenv("FIBA_FIXTURE_DATE")
    if override:clock_date=date.fromisoformat(override)
    evidence=[]
    failures=[]
    for (track,comp),url in SOURCES.items():
        try:
            raw=acquire(url)
            fixtures=parse_fixtures(raw,track,comp,url,clock_date)
            if not fixtures:
                failures.append({"competition":comp,"reason":"NO UPCOMING OFFICIAL MATCHES PARSED"})
            evidence.extend(fixtures)
            print(f"{comp}: {len(fixtures)} parsed future fixtures",flush=True)
        except Exception as exc:
            failures.append({"competition":comp,"reason":str(exc)[:220]})
    evidence=list({x["id"]:x for x in evidence}.values())
    men=sum(x["track"]=="men" for x in evidence)
    women=sum(x["track"]=="women" for x in evidence)
    # Do not publish partial calendar if it would silently delete a whole lane.
    if len(evidence)<10 or not men or not women or failures:
        print("FIBA source refresh skipped; last verified fixture snapshot preserved. "
              f"Total={len(evidence)}, men={men}, women={women}, errors={failures}",file=sys.stderr)
        return 2
    evidence.sort(key=lambda x:(x["date"],x["publishedTime"],x["id"]))
    payload={
      "schema":"FIBA-FIXTURE-SNAPSHOT-1","verifiedOn":clock_date.isoformat(),
      "publishedBy":"LJDP scheduled official FIBA calendar fetch",
      "warning":"Official scheduled matchups only; clocks use unspecified FIBA display zone. Source does not validate odds, live status, scores or LJPC.",
      "sources":list(SOURCES.values()),"events":evidence
    }
    body="/* Official FIBA fixture-only import. No generated betting lines or model predictions. */\nwindow.LJ_FIBA_FIXTURES="+json.dumps(payload,ensure_ascii=False,indent=2)+";\n"
    if OUT.read_text(encoding="utf-8")!=body:
        OUT.write_text(body,encoding="utf-8")
        print(f"Published {len(evidence)} verified future fixtures.",flush=True)
    else:
        print("Verified schedule unchanged.",flush=True)
    return 0

if __name__=="__main__":
    sys.exit(run())
