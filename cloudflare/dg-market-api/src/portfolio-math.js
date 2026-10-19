// All account sums use integer ten-thousandths of a dollar. Missing values stay unknown.
export const number=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))?Number(x):null;
export const dollars=(row,name,legacy)=>number(row?.[name])??(legacy&&number(row?.[legacy])!==null?number(row[legacy])/100:null);
export const key=p=>String(p.exchange_index??0)+':'+p.ticker;
export function mergeRows(old,rows,id){const m=new Map(old.map(x=>[id(x),x]));for(const r of rows)m.set(id(r),r);return [...m.values()]}
const sum=(rows,fn)=>{const v=rows.map(fn);return v.every(x=>x!==null)?v.reduce((a,x)=>a+Math.round(x*10000),0)/10000:null};
export function normalizePosition(p,settled=false){
 const signed=number(p.position_fp??p.position),qty=signed===null?null:Math.abs(signed);
 return {ticker:p.ticker,exchange_index:p.exchange_index??0,series:p.ticker?.split('-')[0],quantity:qty,
 side:signed===null||signed===0?null:signed>0?'YES':'NO',state:settled?'SETTLED':signed===0?'CLOSED':'OPEN',
 cost_basis:dollars(p,'market_exposure_dollars','market_exposure'),realized_pnl:dollars(p,'realized_pnl_dollars','realized_pnl'),
 fees:dollars(p,'fees_paid_dollars','fees_paid'),total_traded:dollars(p,'total_traded_dollars','total_traded'),
 updated_at:p.last_updated_ts||null};
}
export function buildReport(live,settled,archived,fills,options={}){
 // Historical and live handoff overlap must never double-count a market.
 const map=new Map();for(const [rows,isSettled] of [[archived,true],[settled,true],[live,false]])for(const p of rows){
 const k=key(p),old=map.get(k);if(!old||Date.parse(p.last_updated_ts)>=Date.parse(old.raw.last_updated_ts)||!isSettled)map.set(k,{raw:p,row:normalizePosition(p,isSettled)});
 }
 const all=[...map.values()].map(x=>x.row),selected=all.filter(r=>(!options.series||r.series===options.series)&&(!options.from||r.updated_at>=options.from)&&(!options.to||r.updated_at<options.to));
 const closed=selected.filter(r=>r.state!=='OPEN'),gross=sum(closed,r=>r.realized_pnl),fees=sum(closed,r=>r.fees),net=gross===null||fees===null?null:Math.round((gross-fees)*10000)/10000;
 const scored=closed.filter(r=>r.realized_pnl!==null&&r.fees!==null),wins=scored.filter(r=>r.realized_pnl-r.fees>0).length,losses=scored.filter(r=>r.realized_pnl-r.fees<0).length;
 const eligibleFills=fills.filter(f=>(!options.series||(f.ticker||f.market_ticker||'').split('-')[0]===options.series)&&(!options.from||f.created_time>=options.from)&&(!options.to||f.created_time<options.to));
 return {rows:selected.sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at))),summary:{closed_markets:closed.length,open_markets:all.filter(r=>r.state==='OPEN').length,
 reported_realized_pnl:gross,closed_market_fees:fees,realized_less_fees:net,wins,losses,breakeven:scored.length-wins-losses,unscored:closed.length-scored.length,
 win_rate:scored.length?wins/scored.length:null,fill_count:eligibleFills.length,fill_fees:sum(eligibleFills,f=>number(f.fee_cost)),
 open_cost_basis:sum(all.filter(r=>r.state==='OPEN'),r=>r.cost_basis)},
 methodology:'Closed-market cohort by Kalshi last-updated timestamp. P&L is Kalshi reported realized P&L; P&L less fees is that field minus separately reported fill fees. Fees are not subtracted twice. Fill fees are a separate activity measure, not added to position fees. Dates select whole market records, not period cash flows. Open P&L, deposits, withdrawals and taxes are excluded. Coverage is limited to the API key’s default/primary subaccount.'};
}
export function assessPosition(position,history,entryCheckpoint=null,now=Date.now()){
 const out={entry:'UNKNOWN',entry_statement:'No eligible pre-entry D&G checkpoint found.',stance:'WAIT',icon:'⚪',statement:'Insufficient current evidence. Review the position on Kalshi.',confidence:null,match_rate:null,matches:0,cash_out_at:null,auto_sell_price:null,reversal:false,experimental:true};
 const c=history?.current_contract,cmp=history?.comparison,observed=Date.parse(history?.quote_observed_at_utc),retrieved=Date.parse(history?.retrieved_at_utc);
 const side=position.side==='YES'?'UP':position.side==='NO'?'DOWN':null;
 if(entryCheckpoint?.model?.suggested_side&&entryCheckpoint.yes_maps_to_up===true){out.entry=entryCheckpoint.model.suggested_side===side?'SUPPORTED':'OPPOSED';out.entry_statement=out.entry==='SUPPORTED'?'✓ Entry aligned with the recorded experimental D&G signal.':'✕ Entry opposed the recorded experimental D&G signal.';out.entry_at=entryCheckpoint.recorded_at_utc;}
 if(!c||c.ticker!==position.ticker||history.yes_maps_to_up!==true||!side)return out;
 if(Date.parse(c.close_time_utc)<=now)return {...out,statement:'Contract closed. Await settlement; no exit recommendation.'};
 const at=Date.parse(c.candles?.at(-1)?.time_utc);
 if(![observed,retrieved,at].every(t=>Number.isFinite(t)&&t<=now)||now-observed>90000||now-retrieved>90000||now-at>120000)return {...out,statement:'Market evidence is stale. Refresh before making an exit decision.'};
 out.assessed_at=new Date(now).toISOString();out.valid_until=new Date(Math.min(observed+90000,retrieved+90000,at+120000,Date.parse(c.close_time_utc))).toISOString();
 if(cmp?.state!=='EXPERIMENTAL_SUGGESTION'||!['UP','DOWN'].includes(cmp.suggested_side))return {...out,statement:'D&G has no eligible directional signal. No supported hold-or-exit call.'};
 out.match_rate=cmp.observed_majority_fraction;out.matches=cmp.matches;out.signal_side=cmp.suggested_side;
 const recent=c.candles.slice(-3),values=recent.map(p=>number(p.yes_midpoint_dollars)),consecutive=recent.length===3&&recent.every((p,i)=>!i||Date.parse(p.time_utc)-Date.parse(recent[i-1].time_utc)===60000);
 const adverse=consecutive&&values.every(v=>v!==null)&& (side==='UP'?values[0]-values[2]>=.04:values[2]-values[0]>=.04);
 if(cmp.suggested_side===side)return {...out,stance:adverse?'WATCH':'HOLD',icon:adverse?'🟡':'🟢',statement:adverse?'D&G still aligns, but the quote moved against you by at least 4¢ over two minutes. Watch the next minute for a confirmed signal flip.':'D&G would provisionally stay: the current analog still supports your side. Reassess on the next minute; consider exit if the signal flips and the adverse move persists.'};
 return {...out,stance:adverse?'CONSIDER_EXIT':'WATCH',icon:adverse?'🔴':'🟡',reversal:adverse,statement:adverse?'D&G would consider cashing out now: its signal opposes your side and the quote moved against you by at least 4¢ over two minutes. Check the live bid and available size on Kalshi before selling.':'D&G now favors the opposite side. Watch for a continuing adverse move across three consecutive minute quotes before considering an exit.'};
}
