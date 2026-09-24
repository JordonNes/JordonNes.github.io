/* LEGZ & JINX — immutable published-suggestion accuracy explorer */
(() => {
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const n=v=>String(v??'').trim();
  const pct=(h,m)=>h+m?((100*h/(h+m)).toFixed(1)+"%"):"NOT SCORED";
  const norm=v=>n(v).toLowerCase();
  const asDate=v=>n(v).slice(0,10);
  const money=v=>v===null||v===undefined||v===""?"—":(Number(v)>0?"+":"")+String(v);
  const state={ledger:[],results:new Map(),filtered:[],loaded:false};

  function csv(text){
    const rows=[];let row=[],cell="",q=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(q){
        if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}
        else if(ch==='"')q=false;
        else cell+=ch;
      }else{
        if(ch==='"')q=true;
        else if(ch===','){row.push(cell);cell="";}
        else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell="";}
        else if(ch!=='\r')cell+=ch;
      }
    }
    if(cell||row.length){row.push(cell);rows.push(row);}
    if(!rows.length)return[];
    const head=rows.shift();
    return rows.filter(r=>r.some(x=>x!=="")).map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??""])));
  }
  const gradeOf=s=>{
    const r=state.results.get(s.suggestion_id);
    const g=n(r&&r.grade).toUpperCase();
    if(g==="WIN"||g==="HIT")return"HIT";
    if(g==="LOSS"||g==="MISS")return"MISS";
    if(g==="PUSH"||g==="VOID"||g==="PUSH/VOID")return"PUSH/VOID";
    return"UNGRADED";
  };
  function options(vals,label){
    const uniq=[...new Set(vals.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
    return '<option value="">'+esc(label)+'</option>'+uniq.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
  }
  function stats(rows){
    let h=0,m=0,v=0,u=0;const unique=new Set();
    for(const s of rows){
      const g=gradeOf(s); if(g==="HIT")h++; else if(g==="MISS")m++; else if(g==="PUSH/VOID")v++; else u++;
      unique.add(s.outcome_key||s.suggestion_id);
    }
    return {rows:rows.length,h,m,v,u,unique:unique.size,accuracy:pct(h,m)};
  }
  function render(){
    const q=norm(document.getElementById("acc-q").value);
    const date=document.getElementById("acc-date").value;
    const league=document.getElementById("acc-league").value;
    const cls=document.getElementById("acc-class").value;
    const placement=document.getElementById("acc-placement").value;
    const grade=document.getElementById("acc-grade").value;
    const market=norm(document.getElementById("acc-market").value);
    state.filtered=state.ledger.filter(s=>{
      if(s.capture_validity!=="VALID"||s.accuracy_eligible!==true)return false;
      if(date&&asDate(s.publication_date_pt)!==date)return false;
      if(league&&s.league!==league)return false;
      if(cls&&s.market_class!==cls)return false;
      if(placement&&!(s.placements||[]).includes(placement))return false;
      if(grade&&gradeOf(s)!==grade)return false;
      if(market&&!norm(s.market).includes(market))return false;
      if(q){
        const hay=[s.participant,s.selection,s.display_text,s.event_id,s.book,s.market].map(norm).join(" ");
        if(!hay.includes(q))return false;
      }
      return true;
    });
    const st=stats(state.filtered);
    document.getElementById("acc-metrics").innerHTML=[
      ["SUGGESTION VERSIONS",st.rows,"Filtered immutable publication versions"],
      ["UNIQUE OUTCOMES",st.unique,"Same outcome collapsed across updated versions"],
      ["DECISIVE ACCURACY",st.accuracy,st.h+" HIT • "+st.m+" MISS"],
      ["UNRESOLVED",st.u,st.v+" PUSH/VOID • "+st.u+" ungraded"]
    ].map(([a,b,c])=>'<div class="key-item"><b>'+esc(a)+'</b><span class="acc-big">'+esc(b)+'</span><span>'+esc(c)+'</span></div>').join("");

    const rows=state.filtered.slice().sort((a,b)=>String(b.first_seen_at_utc).localeCompare(String(a.first_seen_at_utc))).slice(0,500);
    document.getElementById("acc-count").textContent=state.filtered.length+" matching published suggestion version(s)"+(state.filtered.length>500?" • showing newest 500":"");
    document.getElementById("acc-body").innerHTML=rows.length?rows.map(s=>{
      const g=gradeOf(s),line=[s.side,s.threshold,s.market].filter(x=>x!==null&&x!==undefined&&x!=="").join(" ");
      return '<tr>'+
        '<td>'+esc(s.publication_date_pt)+'</td>'+
        '<td>'+esc(s.league)+'</td>'+
        '<td>'+esc(s.event_id||"—")+'</td>'+
        '<td><b>'+esc(s.participant||s.selection||"—")+'</b><span class="prediction-meta">'+esc(line||s.selection||"—")+'</span></td>'+
        '<td>'+esc(s.market_class==="GAME_ML"?"Game Winner":"POM")+'</td>'+
        '<td>'+esc(money(s.price))+'<span class="prediction-meta">'+esc(s.book||"—")+'</span></td>'+
        '<td><b class="confidence">'+esc(s.ljpc===null||s.ljpc===undefined?"—":s.ljpc+"%")+'</b></td>'+
        '<td>'+esc((s.placements||[]).join(", ")||"—")+'</td>'+
        '<td><b class="'+(g==="HIT"?"green":g==="MISS"?"red":"muted")+'">'+esc(g)+'</b></td>'+
      '</tr>';
    }).join(""):'<tr><td colspan="9" class="muted">No published suggestions match these filters.</td></tr>';
  }
  async function load(){
    const status=document.getElementById("acc-load");
    try{
      status.textContent="Loading immutable publication history…";
      const [lr,rr]=await Promise.all([
        fetch("data/suggestion_ledger.json",{cache:"no-store"}),
        fetch("data/results.csv",{cache:"no-store"})
      ]);
      if(!lr.ok)throw new Error("suggestion ledger unavailable");
      const ledger=await lr.json();
      const resultRows=rr.ok?csv(await rr.text()):[];
      state.results=new Map(resultRows.map(r=>[r.prediction_id,r]));
      state.ledger=(ledger.suggestions||[]);
      state.loaded=true;
      const valid=state.ledger.filter(s=>s.capture_validity==="VALID"&&s.accuracy_eligible===true);
      document.getElementById("acc-date").innerHTML=options(valid.map(s=>s.publication_date_pt),"All publication dates");
      document.getElementById("acc-league").innerHTML=options(valid.map(s=>s.league),"All sports");
      document.getElementById("acc-placement").innerHTML=options(valid.flatMap(s=>s.placements||[]),"All website placements");
      status.textContent="Immutable ledger loaded • "+valid.length+" accuracy-eligible version(s)";
      render();
    }catch(err){
      status.textContent="Accuracy Explorer could not load: "+err.message;
      status.classList.add("red-text");
    }
  }
  window.renderLJAccuracyExplorer=()=>{
    document.getElementById("app").innerHTML='<div class="page accuracy-page">'+
      '<div class="topbar"><a class="lj-mini" href="LJ_index.html">L&amp;J</a><div class="meta">IMMUTABLE PUBLISHED-SUGGESTION AUDIT</div></div>'+
      '<section class="hero recap-hero"><div class="kicker">📈 L&amp;J ACCURACY EXPLORER</div><h1>PUBLISHED POM<br>&amp; GAME WINNER HISTORY</h1><p>Every accuracy-eligible POM or Game Winner actually displayed by LJDP is retained as an immutable publication version. Updated lines create new versions; repeated placement of the same exact version does not multiply its accuracy weight.</p><div class="actions"><a class="action" href="Recap.html">← Previous-Day Recap</a><a class="action" href="LJ_index.html">Today’s Predictions</a></div></section>'+
      '<section class="section"><div class="section-head"><h2>FILTER THE L&amp;J RECORD</h2><span id="acc-load" class="muted">Preparing ledger…</span></div>'+
        '<div class="accuracy-filters">'+
          '<input id="acc-q" type="search" placeholder="Player, team, game ID, book…">'+
          '<select id="acc-date"></select><select id="acc-league"></select>'+
          '<select id="acc-class"><option value="">Props + Game Winners</option><option value="PLAYER_PROP">Player Props</option><option value="GAME_ML">Game Winners</option></select>'+
          '<select id="acc-placement"></select>'+
          '<select id="acc-grade"><option value="">All grades</option><option>HIT</option><option>MISS</option><option>PUSH/VOID</option><option>UNGRADED</option></select>'+
          '<input id="acc-market" type="search" placeholder="Market: receptions, points…">'+
          '<button id="acc-clear" class="action" type="button">Clear</button>'+
        '</div></section>'+
      '<section class="section"><div id="acc-metrics" class="confidence-key"></div></section>'+
      '<section class="section"><div class="section-head"><h2>EXACT IMMUTABLE SUGGESTIONS</h2><span id="acc-count" class="muted"></span></div><div class="card"><div class="card-body accuracy-table-wrap"><table><thead><tr><th>Date</th><th>Sport</th><th>Game</th><th>Player / Pick</th><th>Class</th><th>Price / Book</th><th>LJPC</th><th>Placement</th><th>Grade</th></tr></thead><tbody id="acc-body"><tr><td colspan="9" class="muted">Loading…</td></tr></tbody></table></div></div></section>'+
      '<div class="footer">LEGZ &amp; JINX • Immutable publication history • Quarantined and ambiguous records are preserved but excluded from accuracy</div>'+
    '</div>';
    ["acc-q","acc-date","acc-league","acc-class","acc-placement","acc-grade","acc-market"].forEach(id=>{
      document.getElementById(id).addEventListener(id.includes("q")||id.includes("market")?"input":"change",render);
    });
    document.getElementById("acc-clear").addEventListener("click",()=>{
      ["acc-q","acc-date","acc-league","acc-class","acc-placement","acc-grade","acc-market"].forEach(id=>document.getElementById(id).value="");
      render();
    });
    load();
  };
})();