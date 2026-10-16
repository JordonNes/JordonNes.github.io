# D&G forward accuracy protocol — gavavi-forward-5m-r1

Goal: measure experimental direction accuracy, with honest abstention and coverage reporting, before publishing any confidence percentage. No trading, fees, return targets or profits are part of this experiment. This does not promote the historical analog heuristic to a validated model.

## Fixed observation cohort

All 21 supported Kalshi 15-minute series are eligible. Cloudflare collection runs at minute 6 of each quarter-hour (06, 21, 36, 51). The server accepts an observation from minute 6 inclusive to before minute 7. It uses paired completed one-minute quotes through exactly minute 5, current contract identity, archived historical comparisons and actual retrieval timestamps. A response or quote snapshot older than 30 seconds cannot create a record. Missing minute-5 quotes, insufficient matching history, an unverified YES-to-UP mapping or an inconclusive rule produces ABSTAIN, not an invented direction. Ineligible/missing captures are separate from abstentions.

The historical matching rule remains gavavi-history-analog-r1. At most 24 archived hours are selected (five recent completed hours plus up to 19 matching Pacific hours within a 30-day search), with exact immutable archive keys retained in coverage. The live cards still show their latest-minute comparison; the accuracy page measures only the explicitly fixed minute-5-feature checkpoint. It does not claim to score every changing card suggestion.

## Immutable evidence and settlement joins

Records are server-built; clients cannot supply a probability or direction. R2 first-writer-wins conditional writes preserve one observation per series/window. Save the actual write receipt, collection time, feature cutoff, completed feature candles, historical counts/coverage/archive keys, heuristic version, direction or abstention, and minute-5 market benchmark. Confidence and model probability stay null. Keep outcomes in a separate create-once object.

Scoring runs separately at minutes 10, 25, 40, 55 and revisits the previous two windows. Require the exact official ticker, binary type, matching open/close times and 900-second duration, settled/finalized status, YES/NO result and an actual settlement timestamp after close. Both recorded time and R2 upload receipt must precede close. Never substitute expiry time for settlement. Delayed or failed joins remain pending; the bounded score endpoint can revisit older saved records within 30 days.

## Metrics and limitations

The accuracy page shows twelve quarter-hour slots per selected series, including missing observations and pending settlements, with earlier-page navigation and raw evidence download. Hit rate is correct / (correct + incorrect) for scored suggestions only. Show abstentions and record coverage alongside it. The market direction benchmark is UP above 50 cents, DOWN below, and no direction at a tie, using the same completed minute-5 paired YES midpoint. Compare D&G and the benchmark only on the same non-tied suggestion subset. Benchmark Brier can be computed; model Brier is null because no calibrated model probability exists. No hit rate or confidence percentage is invented when the denominator is zero.

This small rolling display is not a full-history out-of-sample release test, an independence claim, a profitability test or proof that D&G beats the market. Frozen independent evaluation, enough genuinely prospective calls, calibration and uncertainty assessment remain required before publishing confidence. Prior experiment failures remain applicable. Scheduled capture/scoring status is visible; a configured cron is not proof of successful collection.

## Operational bounds

Capture and scoring use separate Cloudflare cron invocations. Capture uses at most two official Kalshi reads per series (42 external reads); scoring has at most 42 market reads. R2/KV operations are bounded below the documented internal-service limits by the 24-hour-snapshot cap. Existing shared Kalshi pacing, 429 cooldown and end-to-end deadlines remain active. No historical source backfill runs inside a user page load or accuracy cron. Keep normal TAAPI collection on its original schedule. Newly changed Cloudflare cron triggers can take up to 15 minutes to propagate; confirm real receipts and heartbeats, not merely deployment success.
