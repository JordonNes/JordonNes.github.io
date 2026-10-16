# Gavavi fixed early-exit research r1

Scope: BTC Kalshi 15-minute binary UP/DOWN outcome contracts. All 21 GAM markets remain listed, but unsupported early-exit markets explicitly have no study. The page shows WAIT until execution and forward evidence exist. No orders or trading permissions are introduced.

## Frozen experiment

The first source run freezes a 96-hour completed-clock-hour window. The first 48 hours are the development description and the last 48 hours the chronological holdout. Rules are committed before that source run; there is no timing/target optimization, holdout tuning or rule selection. Subsequent reruns reuse the same anchor and source snapshots rather than shifting the holdout. A new experiment requires a new version.

At minute 5, for UP and DOWN symmetrically, require midpoint minute3 minus minute4 >=3 cents, midpoint minute5 minus minute4 >=1 cent, and minute5 spread <=4 cents. If that setup is present, model entry at minute6's ask, admitted only in the predeclared 10–80 cent range. This is a delayed hypothetical marketable entry with a price-range condition, not a same-candle retrospective best entry.

For minutes7–11, observe the first bid >= entry ask+8 cents. The target-exit quote scenario is capped at that target even if the observed bid is higher. Otherwise exit at minute11's bid. Compare this with a minute11 exit on the same entry/side. Both directions derive correctly crossed bid/ask from YES quotes (NO bid=1−YES ask; NO ask=1−YES bid). Target observations are paired minute bid/ask closes, not highs, trades or demonstrated fills. Settlement labels do not determine the entry or exit rule.

## Data integrity and uncertainty

Only exact quarter-hour windows and unique minute timestamps are admitted. Complete paired quotes for minutes3–11 are required for an entry/exit comparison; a missing minute remains a gap. Exclusion of incomplete paths can create selection bias, so target rates describe only covered cases. Source coverage and missing contracts are reported. At least30 holdout setups are needed for the exploratory eight-setup moving-block interval (1,000 replications, fixed seed). Sparse/regime-limited samples do not establish general predictability.

The Worker retains a bounded single-hour endpoint (at most four contracts per request) and extends its lookback to120 completed hours to collect this96-hour study with clock-rollover margin. Requests use the existing authenticated, paced, cached GET coordinator and immutable R2 source snapshots. No broader market types are admitted. The source manifest also preserves hour bodies, their retrieval times and a fixed study anchor in GitHub. Source and engine hashes bind the result artifact.

## Conditional costs, not expected profits

Show scenarios for10 hypothetical contracts, with current observed series quadratic taker metadata applied to both legs, per-order cent rounding, and slippage of0,1 or2 cents per leg. Historical schedules, event overrides, account fees, maker auto-sell fees and true slippage are unverified. Entry and exit fees are evaluated at the assumed slipped prices, capped to[0,1]. Quantity, rules and costs are research assumptions, not order instructions or personal position sizing.

The main scenario uses1 cent per leg. Mean hypothetical net and target-vs-timed-exit differences are conditional on full fills at assumed prices. They are not realized profits or expected net profit. Fill probability, expected net profit, executable liquidity and recommendation validation remain unknown/false even if conditional arithmetic is positive. Any exploratory positive interval is named only a positive conditional quote scenario.

A Kalshi Auto Sell is a resting limit sale and may fill partly or remain unfilled. The quote scenario with taker fees is not an exact simulation of that order. Queue position, depth, transient prices, order latency, cancellations and intraminute ordering are absent. No downside stop is inferred. Historical results cannot establish an ideal entry time, fill probability or positive expected net profit. A fresh forward execution study is required.

References: [Kalshi Auto Sell](https://help.kalshi.com/en/articles/15521632-auto-sell-take-profit), [fee schedule](https://kalshi.com/fee-schedule).
