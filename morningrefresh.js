/* LEGZ & JINX — SEP 9 MASTER VALIDATION OVERLAY
   9:00 PM PT source-conflict correction only. This is NOT the Sep 9 morning refresh.
   Newer public market data conflicts with the connected probable-pitcher feed in COL-NYY, so pitcher props are gated rather than guessed.
   DATA ONLY — approved presentation remains locked. */
(() => {
 const D=window.LJ_DATA; if(!D||!D.sports||!D.sports.MLB) return;
 const M=D.sports.MLB;
 const WATCH="WATCH — exact current market/starter not independently reconciled";
 M.hotTop=(M.hotTop||[]).filter(x=>x[0]!=="Will Warren");
 M.twenty=(M.twenty||[]).filter(x=>x[1]!=="Will Warren");
 const patch=(away,home,o)=>{const r=(M.qcs||[]).find(x=>x.away===away&&x.home===home);if(r)Object.assign(r,o);};
 patch("COL","NYY",{market:"NYY -245 / COL +200 current FanDuel snapshot • STARTER CONFLICT",winner:"Yankees ML",conf:"73%",hot:["NYY starter — WATCH: StatsHawk lists Will Warren; newer FanDuel board lists Max Fried"],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Cross-source probable-pitcher conflict is unresolved. Team price is current; all Yankees/Rockies pitcher props are withheld until the 9 AM recheck."});
 patch("TB","ATL",{market:"ATL -122 / TB +104 current FanDuel snapshot • Griffin Jax vs Reynaldo López",winner:"Rays value lean",conf:"57%",hot:["Pitcher/player props WATCH until exact thresholds open"],sns1:[WATCH],sns2:[WATCH],normal:[WATCH],demon:[WATCH],foot:"Newer FanDuel board resolves Atlanta starter as Reynaldo López and numberFire favors Tampa Bay 57.23% despite Atlanta being the market favorite."});
 const ny=(M.winners||[]).find(x=>x[0]==="COL @ NYY");if(ny){ny[1]="Yankees ML -245 snapshot";ny[2]="73%";ny[3]="Current FanDuel board strongly favors New York; pitcher identity conflict prevents pitcher-prop activation.";}
 const tb=(M.winners||[]).find(x=>x[0]==="TB @ ATL");if(tb){tb[1]="Rays value lean +104 snapshot";tb[2]="57%";tb[3]="FanDuel market favors Atlanta -122, while current numberFire projection favors Tampa Bay 57.23%.";}
 M.description += " Final validation: COL-NYY has a cross-source starter conflict and all pitcher props there are WATCH; newer FanDuel data resolves Atlanta's probable starter as Reynaldo López.";
})();
