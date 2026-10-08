# Damilola & Gavavi Markets — Kalshi Integration Plan

Status: Approved source architecture; credentials not stored in the repository.

## User-provided documentation references
- Kalshi API documentation: https://share.google/BeNYZZn21N7NqqB7L
- Kalshi Perps API documentation: https://share.google/jdSVSVyRtpm2NLK05
- Kalshi API Keys documentation: https://share.google/7Mz2jqNZcS8BnHtxW

The share links should remain source references. Never place API secrets, private keys, account identifiers, access tokens, or signed requests in the public repository.

## Source roles

### Kalshi prediction/event markets
Use as a structured market-data source for:
- Market Pulse
- Watchlist
- Opportunities
- Research context
- Market Calendar / event settlement context

Keep raw market observations distinct from D&G interpretation. Store source timestamps, market identifiers, bid/ask or market price fields when available, market status, and retrieval time.

### Kalshi perpetual futures
Treat perps as a separate source class from Kalshi prediction markets. Use for:
- Market Pulse
- Risk Board
- Watchlist
- Portfolio Lab reference data
- Volatility / funding / directional-market context

Perps use separate margin-account concepts and may use separate credentials/hosts. Do not assume prediction-market credentials can be reused.

## Authentication and API-key handling

The API-key documentation is an approved implementation reference for authenticated Kalshi access.

Security rules:
- Never place Kalshi API keys, private keys, PEM material, signing secrets, access tokens, account identifiers, or signed request examples containing live credentials in GitHub Pages, client-side JavaScript, committed JSON, HTML, markdown, or public Actions logs.
- Browser-side code may consume only public or already-sanitized data.
- Authenticated Kalshi requests must execute from a protected server-side environment or CI/runtime with secret storage.
- Keep demo and production credentials separate.
- Rotate or revoke credentials immediately if they are ever exposed.
- Do not print secret values in application logs, error messages, analytics, or debugging output.
- Expose only the minimum required derived data to the public D&G site.

## Integration boundaries
1. Read-only market-data ingestion first.
2. No trade execution from the public website.
3. No secrets in browser JavaScript, GitHub Pages, committed JSON, or public Actions logs.
4. Server-side or protected-secret execution only for authenticated endpoints.
5. Demo/sandbox validation before any production connection.
6. Every observation records source, retrieval timestamp, and environment.
7. Prediction-market and perps records remain distinguishable in storage.
8. D&G analysis must label observed data separately from model output and editorial judgment.

## Proposed normalized record

```json
{
  "source": "kalshi",
  "source_class": "prediction_market | perps",
  "environment": "demo | production",
  "instrument_id": "",
  "symbol_or_ticker": "",
  "market_title": "",
  "status": "",
  "bid": null,
  "ask": null,
  "last": null,
  "volume": null,
  "open_interest": null,
  "funding_rate": null,
  "next_funding_at": null,
  "observed_at_utc": "",
  "retrieved_at_utc": "",
  "raw_source_ref": ""
}
```

## D&G use rules
- Market Pulse may summarize but must link every conclusion back to dated observations.
- Watchlist stores thesis, catalyst, risk, review date, and source freshness.
- Opportunities cannot be generated solely from a single Kalshi price.
- Risk Board should surface leverage, liquidation, funding, volatility, liquidity, and event-resolution risks where relevant.
- Portfolio Lab remains simulation-first and should not imply live execution capability.
- Any future trading capability requires a separate explicit approval and security review.
