# OddsPapi LSI setup

OddsPapi is integrated as a **historical research and calibration source**, not as a live publication dependency.

## Required GitHub secret

Create one repository Actions secret:

- `ODDSPAPI_API_KEY` = your OddsPapi API key

The adapter also accepts the legacy alias `ODDS_PAPI_API_KEY`, but `ODDSPAPI_API_KEY` is the preferred name.

## Recommended free-tier variables

No repository variables are required; safe defaults are built in.

Optional Actions variables:

- `ODDSPAPI_MAX_DISCOVERY_CALLS=4`
- `ODDSPAPI_MAX_HISTORY_FIXTURES=8`
- `ODDSPAPI_MIN_QUOTA_REMAINING=20`
- `ODDSPAPI_BOOKMAKERS=pinnacle,draftkings,fanduel`

## Free-first behavior

The adapter:
1. runs automatically only in the LSI `DISCOVERY` stage;
2. checks `/v4/account` before quota-counted discovery;
3. preserves a minimum quota reserve;
4. caps fixture-discovery calls;
5. uses `/v4/historical-odds` for historical snapshots;
6. never calls live `/v4/odds` by default;
7. stores compact historical features for CLV, market movement, sharp-vs-retail comparison, and future model calibration.

## Outputs

- `data/oddspapi_history_features.csv`
- `data/oddspapi_state.json`

OddsPapi evidence is research input only. It does not automatically publish a LEGZ/JINX pick or raise confidence.
