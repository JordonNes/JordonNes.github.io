/* LJDP runtime loader — canonical payload lives in future_market_board.json. */
(function(){
  try {
    var x=new XMLHttpRequest();
    x.open("GET","data/future_market_board.json?v="+Date.now(),false);
    x.send(null);
    if(x.status>=200&&x.status<300) window.LJ_FUTURE_MARKET_BOARD=JSON.parse(x.responseText);
  } catch(e) { console.error("LJDP future market board load failed",e); }
})();
