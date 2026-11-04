#!/usr/bin/env python3
"""Offline schedule parser tests. No network or bookmaker dependency."""
from datetime import date
from refresh_fiba_fixture_schedule import parse_fixtures

MEN=("Regular Season · Group A BAT BAT TRIER TRIER Tbilisi (GEO)Wed, Nov 11 "
     "16:00 Regular Season · Group H NFT NFT MYK MYK Baku (AZE)Wed, Nov 11 16:00 "
     "Regular Season · Group A FINAL BAT BAT 98 TRIER TRIER 72")
WOMEN=("Regular Season · Group K OVA OVA RSK RSK Ostrava (CZE)Wed, Nov 25 16:15 "
       "Regular Season - First Round · Group B GALA GALA MEC MEC Istanbul (TUR)Wed, Nov 25 17:00")
u="https://www.fiba.basketball/en/events/fiba-europe-cup-26-27"
day=date(2026,11,4)
m=parse_fixtures(MEN,"men","FIBA Europe Cup",u,day)
assert len(m)==2,m
assert [x["home"] for x in m]==["BAT","NFT"],m
assert all(x["away"] in {"TRIER","MYK"} for x in m)
assert all(x["marketStatus"]=="NOT_VERIFIED" for x in m)
assert all(not x.get("price") and not x.get("ljpc") for x in m)
w=parse_fixtures(WOMEN,"women","EuroCup Women",u,day)
assert len(w)==2,w
assert w[0]["home"]=="OVA" and w[1]["home"]=="GALA",w
assert not parse_fixtures(MEN,"men","FIBA Europe Cup",u,date(2026,11,30))
assert len({x["id"] for x in m+w})==4
print("PASS FIBA schedule parser: official shortcode pairs, correct dates, no invented markets, expiry.")
