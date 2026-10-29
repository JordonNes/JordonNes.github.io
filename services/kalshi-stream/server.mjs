import http from 'node:http';
import crypto from 'node:crypto';
import WebSocket from 'ws';

const PORT = Number(process.env.PORT || 3000);
const PATH = '/trade-api/ws/v2';
const WS_URL = process.env.KALSHI_WS_URL || 'wss://external-api-ws.kalshi.com' + PATH;
const KEY_ID = process.env.KALSHI_API_KEY_ID || '';
const PEM = (process.env.KALSHI_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const origins = new Set((process.env.ALLOWED_ORIGINS || 'https://jordonnes.github.io').split(',').map(x=>x.trim()).filter(Boolean));
const MAX_MARKETS = Math.min(1500, Math.max(1, Number(process.env.MAX_MARKETS || 500)));
const STALE_AFTER_MS = 60000;
const prices = new Map();
const clients = new Set();
let upstream = null, connected = false, lastEventAt = null, failures = 0, pending = null;
const iso = () => new Date().toISOString();
const send = (res, event, item) => {
  if (!res.writableEnded) res.write('event: '+event+'\ndata: '+JSON.stringify(item)+'\n\n');
};
function broadcast(event, item) {
  for (const client of clients) {
    try { send(client, event, item); } catch { clients.delete(client); }
  }
}
function signature() {
  const timestamp = String(Date.now());
  const key = crypto.createPrivateKey(PEM);
  const input = Buffer.from(timestamp+'GET'+PATH, 'utf8');
  const sig = key.asymmetricKeyType === 'ed25519'
    ? crypto.sign(null,input,key)
    : crypto.sign('sha256',input,{key,padding:crypto.constants.RSA_PKCS1_PSS_PADDING,saltLength:crypto.constants.RSA_PSS_SALTLEN_DIGEST});
  return {'KALSHI-ACCESS-KEY':KEY_ID,'KALSHI-ACCESS-TIMESTAMP':timestamp,'KALSHI-ACCESS-SIGNATURE':sig.toString('base64')};
}
function ingest(packet) {
  if(packet.type !== 'ticker' || !packet.msg) return;
  const m = packet.msg; const ticker = String(m.market_ticker || '');
  if(!ticker) return;
  const record = {
    ticker, price_dollars:m.price_dollars ?? null,
    yes_bid_dollars:m.yes_bid_dollars ?? null,
    yes_ask_dollars:m.yes_ask_dollars ?? null,
    volume_fp:m.volume_fp ?? null,
    open_interest_fp:m.open_interest_fp ?? null,
    source_time:m.time ?? null,
    received_at:iso()
  };
  if(prices.has(ticker))prices.delete(ticker);
  prices.set(ticker,record);
  if(prices.size>MAX_MARKETS) prices.delete(prices.keys().next().value);
  lastEventAt=record.received_at;
  broadcast('ticker',record);
}
function connect() {
  if(!KEY_ID || !PEM){ console.error('Missing Kalshi credentials; relay remains unavailable'); return; }
  try {
    const ws = new WebSocket(WS_URL,{headers:signature(),handshakeTimeout:12000});
    upstream = ws;
    ws.on('open',()=>{
      connected=true; failures=0;
      ws.send(JSON.stringify({id:1,cmd:'subscribe',params:{channels:['ticker']}}));
      broadcast('status',{upstream_connected:true,at:iso()});
    });
    ws.on('message', raw=>{
      try { ingest(JSON.parse(raw.toString())); }catch{ /* never log market payloads or secrets */ }
    });
    ws.on('error',()=>{ console.error('Upstream connection error (details withheld)'); });
    ws.on('close',()=>{
      connected=false;
      broadcast('status',{upstream_connected:false,at:iso()});
      if(!pending)pending=setTimeout(()=>{pending=null;connect();},Math.min(60000,2000*Math.pow(2,Math.min(++failures,5))));
    });
  }catch {
    connected=false;
    if(!pending)pending=setTimeout(()=>{pending=null;connect();},10000);
  }
}
function allowed(req) {
  const origin=req.headers.origin;
  return !!origin && origins.has(origin);
}
const server=http.createServer((req,res)=>{
  const path = (req.url||'').split('?')[0];
  const origin = req.headers.origin;
  if(path==='/health'){
    res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify({ok:true,upstream_connected:connected,last_event_at:lastEventAt,market_count:prices.size,stale:!lastEventAt||Date.now()-Date.parse(lastEventAt)>STALE_AFTER_MS}));
    return;
  }
  if(!allowed(req)){
    res.writeHead(403,{'Content-Type':'application/json'});
    res.end(JSON.stringify({error:'origin_not_allowed'}));return;
  }
  const headers={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(path==='/snapshot'){
    res.writeHead(200,{...headers,'Content-Type':'application/json'});
    res.end(JSON.stringify({source:'kalshi-websocket-ticker',upstream_connected:connected,last_event_at:lastEventAt,stale:!lastEventAt||Date.now()-Date.parse(lastEventAt)>STALE_AFTER_MS,markets:[...prices.values()]}));return;
  }
  if(path==='/events'){
    if(clients.size>=100){res.writeHead(503,headers);res.end('too_many_clients');return;}
    res.writeHead(200,{...headers,'Content-Type':'text/event-stream','Connection':'keep-alive'});
    clients.add(res);
    send(res,'status',{upstream_connected:connected,last_event_at:lastEventAt,at:iso()});
    // Initial snapshot, then market changes; clients are untrusted and cannot subscribe to private channels.
    send(res,'snapshot',{markets:[...prices.values()]});
    const keep=setInterval(()=>send(res,'heartbeat',{at:iso()}),20000);
    req.on('close',()=>{clearInterval(keep);clients.delete(res)});
    return;
  }
  res.writeHead(404,headers);res.end('not_found');
});
server.listen(PORT,'0.0.0.0',()=>{console.log('Read-only Kalshi relay listening on '+PORT);connect()});
process.on('SIGTERM',()=>{upstream?.close();server.close(()=>process.exit(0))});
