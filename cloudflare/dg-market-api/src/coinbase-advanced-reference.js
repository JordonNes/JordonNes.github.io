// D&G Coinbase Advanced Trade public market-data reference. Read-only; no account keys.
const BASE = 'https://api.coinbase.com/api/v3/brokerage';
const ALLOWED = new Set(['BTC-USD', 'ETH-USD', 'SOL-USD']);
const HEADERS = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=30'};
export async function serveCoinbaseAdvancedReference(request, ctx) {
  const url = new URL(request.url);
  const input = (url.searchParams.get('symbol') || 'BTC-USD').trim().toUpperCase();
  const symbol = ['BTC','ETH','SOL'].includes(input) ? input+'-USD' : input;
  if (!ALLOWED.has(symbol)) return new Response(JSON.stringify({error:'unsupported_symbol',supported:[...ALLOWED]}), {status:400, headers:{...HEADERS,'Cache-Control':'no-store'}});
  const cache = caches.default;
  const cacheKey = new Request(url.origin + '/api/coinbase-advanced-reference?symbol=' + symbol + '&v=1');
  const hit = await cache.match(cacheKey);
  if (hit) {const headers=new Headers(hit.headers);headers.set('X-DG-Cache','HIT');return new Response(hit.body,{status:hit.status,headers});}
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 6500);
  try {
    const upstream = await fetch(`${BASE}/market/products/${symbol}`, {
      headers:{'Accept':'application/json'}, signal:ctl.signal,
      cf:{cacheEverything:true, cacheTtl:30}
    });
    if (!upstream.ok) return new Response(JSON.stringify({error:'coinbase_unavailable',upstream_status:upstream.status,read_only:true}), {status:503,headers:{...HEADERS,'Cache-Control':'no-store'}});
    const data = await upstream.json();
    const positivePrice = (v) => {
      if (typeof v !== 'string' && typeof v !== 'number') return null;
      if (!/^\d+(?:\.\d+)?$/.test(String(v))) return null;
      const n = Number(v); return Number.isFinite(n) && n > 0 ? String(v) : null;
    };
    const price = positivePrice(data.price);
    if (!price || data.product_id !== symbol) return new Response(JSON.stringify({error:'coinbase_unverified_product_payload',read_only:true}),{status:503,headers:{...HEADERS,'Cache-Control':'no-store'}});
    const payload = {
      source:'Coinbase Advanced Trade public product',
      symbol,
      price_usd:price,
      best_bid_usd:positivePrice(data.best_bid_price),
      best_ask_usd:positivePrice(data.best_ask_price),
      volume_24h:data.volume_24h ?? null,
      retrieved_at_utc:new Date().toISOString(),
      market_reference_only:true,
      matches_kalshi_settlement_reference:false,
      forecast_calibrated:false,
      execution_ready:false,
      read_only:true
    };
    const response = new Response(JSON.stringify(payload),{headers:{...HEADERS,'X-DG-Cache':'MISS'}});
    await cache.put(cacheKey,response.clone()).catch(() => {});
    return response;
  } catch {
    return new Response(JSON.stringify({error:'coinbase_request_failed',read_only:true}),{status:503,headers:{...HEADERS,'Cache-Control':'no-store'}});
  } finally {clearTimeout(timer);}
}
