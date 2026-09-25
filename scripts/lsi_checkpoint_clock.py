#!/usr/bin/env python3
"""Resolve LJDP canonical Pacific checkpoints independently of runner delay.

GitHub Actions schedule events can start materially after their nominal cron time.
For scheduled runs, derive the intended checkpoint from the cron expression that
triggered the run, not from the wall clock when a runner eventually starts.

The workflow intentionally registers both PDT and PST UTC hours. The cron's
nominal UTC instant is converted through America/Los_Angeles; only 06/09/12/15/
18/21 Pacific are canonical. The alternate DST expression becomes a harmless
noncanonical duplicate.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

PT = ZoneInfo("America/Los_Angeles")
STAGE_BY_HOUR = {
    6: "DISCOVERY",
    9: "MORNING_PUBLICATION",
    12: "MIDDAY_PUBLICATION",
    15: "MARKET_HISTORY",
    18: "CONTEXT_MARKETS",
    21: "MASTER_PUBLICATION",
}
VALID_STAGES = set(STAGE_BY_HOUR.values())


def parse_now(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def scheduled_instant(schedule: str, now_utc: datetime) -> datetime:
    fields = str(schedule or "").split()
    if len(fields) != 5:
        raise ValueError(f"Expected five-field cron, got: {schedule!r}")
    minute_s, hour_s = fields[0], fields[1]
    if not minute_s.isdigit() or not hour_s.isdigit():
        raise ValueError(
            "Canonical LJDP schedule entries must use one explicit UTC minute/hour "
            f"so delayed jobs retain identity; got {schedule!r}"
        )
    minute, hour = int(minute_s), int(hour_s)
    if not (0 <= minute <= 59 and 0 <= hour <= 23):
        raise ValueError(f"Invalid cron time: {schedule!r}")
    candidate = now_utc.replace(hour=hour, minute=minute, second=0, microsecond=0)
    # A schedule occurrence cannot nominally be in the future. This also handles
    # the 01/02/04/05 UTC expressions whose Pacific checkpoint is the prior date.
    if candidate > now_utc:
        candidate -= timedelta(days=1)
    return candidate


def resolve(
    event_name: str,
    schedule: str = "",
    manual_stage: str = "",
    push_stage: str = "DISCOVERY",
    now_utc: datetime | None = None,
) -> dict:
    now_utc = now_utc or datetime.now(timezone.utc)
    event_name = str(event_name or "")

    if event_name == "workflow_dispatch":
        stage = manual_stage if manual_stage in VALID_STAGES else "DISCOVERY"
        local = now_utc.astimezone(PT)
        return {
            "run_allowed": True,
            "canonical_checkpoint": True,
            "stage": stage,
            "date": local.date().isoformat(),
            "scheduled_for_pt": local.isoformat(),
            "resolution": "MANUAL_STAGE",
        }

    if event_name == "push":
        stage = push_stage if push_stage in VALID_STAGES else "DISCOVERY"
        local = now_utc.astimezone(PT)
        return {
            "run_allowed": True,
            # Used for controlled forced publication pushes. Routine DISCOVERY
            # pushes remain lightweight after the temporary force is removed.
            "canonical_checkpoint": stage != "DISCOVERY",
            "stage": stage,
            "date": local.date().isoformat(),
            "scheduled_for_pt": local.isoformat(),
            "resolution": "PUSH_STAGE",
        }

    if event_name == "schedule":
        nominal_utc = scheduled_instant(schedule, now_utc)
        nominal_pt = nominal_utc.astimezone(PT)
        stage = STAGE_BY_HOUR.get(nominal_pt.hour) if nominal_pt.minute == 0 else None
        return {
            "run_allowed": stage is not None,
            "canonical_checkpoint": stage is not None,
            "stage": stage or "NONCANONICAL_DST_DUPLICATE",
            "date": nominal_pt.date().isoformat(),
            "scheduled_for_pt": nominal_pt.isoformat(),
            "resolution": "SCHEDULE_IDENTITY",
        }

    local = now_utc.astimezone(PT)
    return {
        "run_allowed": False,
        "canonical_checkpoint": False,
        "stage": "UNSUPPORTED_EVENT",
        "date": local.date().isoformat(),
        "scheduled_for_pt": local.isoformat(),
        "resolution": "UNSUPPORTED_EVENT",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--event-name", required=True)
    parser.add_argument("--schedule", default="")
    parser.add_argument("--manual-stage", default="")
    parser.add_argument("--push-stage", default="DISCOVERY")
    parser.add_argument("--now")
    parser.add_argument("--github-output")
    args = parser.parse_args()
    result = resolve(
        args.event_name,
        args.schedule,
        args.manual_stage,
        args.push_stage,
        parse_now(args.now),
    )
    if args.github_output:
        path = Path(args.github_output)
        with path.open("a", encoding="utf-8") as fh:
            for key in ("stage", "date", "scheduled_for_pt", "resolution"):
                fh.write(f"{key}={result[key]}\n")
            fh.write("run_allowed=" + ("true" if result["run_allowed"] else "false") + "\n")
            fh.write("canonical_checkpoint=" + ("true" if result["canonical_checkpoint"] else "false") + "\n")
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
