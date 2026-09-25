#!/usr/bin/env python3
import csv
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import lsi_league_scheduler as sched

PT = ZoneInfo("America/Los_Angeles")


class LeagueSchedulerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.old = (sched.EVENTS, sched.FUTURE, sched.ESPN_EVENTS, sched.OUT, sched.STATE)
        sched.EVENTS = root / "event_inventory.csv"
        sched.FUTURE = root / "future_market_board.json"
        sched.ESPN_EVENTS = root / "espn_event_intelligence.json"
        sched.OUT = root / "lsi_league_schedule.json"
        sched.STATE = root / "lsi_league_scheduler_state.json"

    def tearDown(self):
        sched.EVENTS, sched.FUTURE, sched.ESPN_EVENTS, sched.OUT, sched.STATE = self.old
        self.tmp.cleanup()

    def write_events(self, rows):
        fields = [
            "snapshot_id","collected_at_pt","sport","league","event_id","event_start_pt",
            "away","home","venue","venue_city","venue_state","venue_indoor","source","status"
        ]
        with sched.EVENTS.open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=fields)
            w.writeheader()
            w.writerows(rows)

    def test_weekday_cfb_game_gets_full_event_attention(self):
        # Wednesday, September 23, 2026. A same-day CFB game must be picked up
        # by event gates even though Saturday is the primary CFB volume day.
        now_pt = datetime(2026, 9, 23, 10, 27, tzinfo=PT)
        game_pt = datetime(2026, 9, 23, 19, 0, tzinfo=PT)
        self.write_events([{
            "snapshot_id": "cfb-weekday-test",
            "collected_at_pt": now_pt.isoformat(),
            "sport": "NCAA_Football",
            "league": "NCAA_Football",
            "event_id": "CFB-WED-1",
            "event_start_pt": game_pt.astimezone(timezone.utc).isoformat(),
            "away": "Weekday Away",
            "home": "Weekday Home",
            "venue": "Test Stadium",
            "venue_city": "Test",
            "venue_state": "CA",
            "venue_indoor": "False",
            "source": "TEST",
            "status": "STATUS_SCHEDULED",
        }])
        payload = sched.build_schedule(now_pt.astimezone(timezone.utc))
        self.assertIn("NCAA_Football", payload["due_leagues"])
        cfb = next(x for x in payload["league_work"] if x["league"] == "NCAA_Football")
        self.assertIn("T-12H", cfb["reasons"])
        self.assertEqual(cfb["events"][0]["event_id"], "CFB-WED-1")

    def test_ack_prevents_repeating_same_cfb_gate(self):
        now_pt = datetime(2026, 9, 23, 10, 27, tzinfo=PT)
        game_pt = datetime(2026, 9, 23, 19, 0, tzinfo=PT)
        self.write_events([{
            "snapshot_id": "cfb-ack-test",
            "collected_at_pt": now_pt.isoformat(),
            "sport": "NCAA_Football",
            "league": "NCAA_Football",
            "event_id": "CFB-WED-ACK",
            "event_start_pt": game_pt.astimezone(timezone.utc).isoformat(),
            "away": "Away",
            "home": "Home",
            "source": "TEST",
            "status": "STATUS_SCHEDULED",
        }])
        first = sched.build_schedule(now_pt.astimezone(timezone.utc))
        sched.ack_schedule(sched.OUT)
        second = sched.build_schedule(now_pt.astimezone(timezone.utc))
        first_cfb = next(x for x in first["league_work"] if x["league"] == "NCAA_Football")
        self.assertTrue(first_cfb["gate_ids"])
        second_cfb = [x for x in second["league_work"] if x["league"] == "NCAA_Football"]
        self.assertEqual(second_cfb, [])

    def test_saturday_volume_wave_runs_even_without_specific_event_gate(self):
        now_pt = datetime(2026, 9, 26, 8, 27, tzinfo=PT)
        self.write_events([])
        payload = sched.build_schedule(now_pt.astimezone(timezone.utc))
        cfb = next(x for x in payload["league_work"] if x["league"] == "NCAA_Football")
        self.assertIn("CFB_SATURDAY_WAVE_0800_PT", cfb["reasons"])

    def test_espn_event_identity_supersedes_provider_id_for_same_game(self):
        now_pt = datetime(2026, 9, 23, 10, 27, tzinfo=PT)
        game_pt = datetime(2026, 9, 23, 19, 0, tzinfo=PT)
        self.write_events([])
        sched.FUTURE.write_text(json.dumps({"events":[{
            "league":"NFL","source_event_id":"PL-123",
            "commence_time":game_pt.astimezone(timezone.utc).isoformat(),
            "away":"ATL Falcons","home":"GB Packers"
        }]}),encoding="utf-8")
        sched.ESPN_EVENTS.write_text(json.dumps({"events":[{
            "league":"NFL","event_id":"401999999","start_utc":game_pt.astimezone(timezone.utc).isoformat(),
            "status":"STATUS_SCHEDULED","teams":[
                {"home_away":"away","display_name":"Atlanta Falcons"},
                {"home_away":"home","display_name":"Green Bay Packers"}
            ]
        }]}),encoding="utf-8")
        merged=sched.merged_events()
        nfl=[x for x in merged if x["league"]=="NFL"]
        self.assertEqual(len(nfl),1)
        self.assertEqual(nfl[0]["event_id"],"401999999")
        self.assertEqual(nfl[0]["source"],"ESPN_EVENT_INTELLIGENCE")

    def test_mma_is_not_polled_aggressively_between_event_windows(self):
        now_pt = datetime(2026, 9, 23, 10, 27, tzinfo=PT)
        game_pt = datetime(2026, 9, 28, 19, 0, tzinfo=PT)  # >72 hours away
        self.write_events([{
            "snapshot_id": "mma-future-test",
            "collected_at_pt": now_pt.isoformat(),
            "sport": "MMA",
            "league": "MMA",
            "event_id": "MMA-1",
            "event_start_pt": game_pt.astimezone(timezone.utc).isoformat(),
            "away": "Fighter A",
            "home": "Fighter B",
            "source": "TEST",
            "status": "STATUS_SCHEDULED",
        }])
        payload = sched.build_schedule(now_pt.astimezone(timezone.utc))
        self.assertNotIn("MMA", payload["due_leagues"])


if __name__ == "__main__":
    unittest.main()
