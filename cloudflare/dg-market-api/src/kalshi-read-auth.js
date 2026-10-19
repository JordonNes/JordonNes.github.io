/* Optional authenticated public-market GETs. No account/order requests or writes.
 * Credentials stay in Worker secrets and are never returned or logged. */
const keys=new Map();
function allowed(path){return typeof path==='string'&&/^\/(?:markets|series|events|historical)(?:[/?]|$)/.test(path)&&!path.includes('..')&&!path.includes('://')}
function concat(...a){const b=new Uint8Array(a.reduce((n,x)=>n+x.length,0));let i=0;for(const x of a){b.set(x,i);i+=x.length}return b}
function der(tag,bytes){let n=bytes.length,a=[];do{a.unshift(n&255);n>>>=8}while(n);const length=bytes.length<128?[bytes.length]:[128|a.length,...a];return concat(new Uint8Array([tag,...length]),bytes)}
function decode(pem){const binary=atob(pem.replace(/-----[^-]+-----/g,'').replace(/\s/g,''));return Uint8Array.from(binary,c=>c.charCodeAt(0))}
async function load(pem){
 if(keys.has(pem))return keys.get(pem);
 const promise=(async()=>{
  let bytes=decode(pem);
  if(pem.includes('BEGIN RSA PRIVATE KEY')){
   // Wrap standard PKCS#1 RSA material in a PKCS#8 PrivateKeyInfo envelope.
   const algorithm=new Uint8Array([48,13,6,9,42,134,72,134,247,13,1,1,1,5,0]);
   bytes=der(48,concat(new Uint8Array([2,1,0]),algorithm,der(4,bytes)));
  }
  try{return await crypto.subtle.importKey('pkcs8',bytes,{name:'RSA-PSS',hash:'SHA-256'},false,['sign'])}
  catch{return await crypto.subtle.importKey('pkcs8',bytes,{name:'Ed25519'},false,['sign'])}
 })();
 if(keys.size>=2)keys.clear();keys.set(pem,promise);
 try{return await promise}catch(e){keys.delete(pem);throw e}
}
export async function kalshiReadHeaders(path,env={}){
 if(!allowed(path))throw Error('KALSHI_READ_PATH_REQUIRED');
 return signedGetHeaders(path,env);
}
export async function kalshiPortfolioHeaders(path,env={}){
 const base=String(path).split('?')[0];
 if(!['/portfolio/positions','/portfolio/fills','/portfolio/settlements','/portfolio/balance','/historical/positions','/historical/fills'].includes(base))throw Error('PORTFOLIO_GET_PATH_REQUIRED');
 if(!env.KALSHI_API_KEY_ID||!env.KALSHI_PRIVATE_KEY)throw Error('ACCOUNT_CREDENTIALS_MISSING');
 return signedGetHeaders(path,env);
}
async function signedGetHeaders(path,env){
 const id=String(env.KALSHI_API_KEY_ID||'').trim(),pem=String(env.KALSHI_PRIVATE_KEY||'').replace(/\\n/g,'\n').trim();
 if(!id&&!pem)return {Accept:'application/json'};
 if(!id||!pem)throw Error('KALSHI_READ_CREDENTIALS_INCOMPLETE');
 const key=await load(pem),timestamp=String(Date.now()),message=timestamp+'GET/trade-api/v2'+path.split('?')[0];
 const algorithm=key.algorithm.name==='RSA-PSS'?{name:'RSA-PSS',saltLength:32}:{name:'Ed25519'};
 const signature=new Uint8Array(await crypto.subtle.sign(algorithm,key,new TextEncoder().encode(message)));
 let binary='';for(const byte of signature)binary+=String.fromCharCode(byte);
 return {Accept:'application/json','KALSHI-ACCESS-KEY':id,'KALSHI-ACCESS-TIMESTAMP':timestamp,'KALSHI-ACCESS-SIGNATURE':btoa(binary)};
}
