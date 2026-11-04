/* Adds HFDB report helpers (loads after supabase.js) */
(function(w){
  if(!w.HFDB || !HFDB.url) return;
  var URL=HFDB.url;
  var KEY='sb_publishable_hSBxsefa3AzA7sLngR07Vw_ruW60q_h';
  function headers(extra){
    var h={'apikey':KEY,'Authorization':'Bearer '+KEY};
    if(extra) Object.keys(extra).forEach(function(k){ h[k]=extra[k]; });
    return h;
  }
  function putJson(path, data){
    return fetch(URL+'/storage/v1/object/campaign-media/'+path,{ method:'POST', headers:headers({'Content-Type':'application/json','x-upsert':'true'}), body:JSON.stringify(data) }).then(function(r){
      return r.text().then(function(t){ if(!r.ok) throw new Error(t||'put failed'); return true; });
    });
  }
  function getJson(path){
    return fetch(URL+'/storage/v1/object/public/campaign-media/'+path+'?t='+Date.now(),{cache:'no-store'}).then(function(r){
      if(!r.ok) return null;
      return r.json().catch(function(){ return null; });
    }).catch(function(){ return null; });
  }
  function listReports(){ return getJson('reports/all.json').then(function(data){ return Array.isArray(data)?data:[]; }); }
  function saveReports(list){ return putJson('reports/all.json', Array.isArray(list)?list:[]); }
  function addReport(payload){
    var row={
      id:payload.id||('r_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),
      campaignId:payload.campaignId||'',
      campaignCode:payload.campaignCode||'',
      campaignTitle:payload.campaignTitle||'',
      reason:payload.reason||'',
      details:payload.details||'',
      links:payload.links||'',
      name:payload.name||'',
      email:String(payload.email||'').toLowerCase().trim(),
      address:payload.address||'',
      status:payload.status||'open',
      at:payload.at||Date.now()
    };
    return listReports().then(function(list){
      list.unshift(row);
      if(list.length>300) list=list.slice(0,300);
      return saveReports(list).then(function(){ return row; });
    });
  }
  HFDB.listReports=listReports;
  HFDB.addReport=addReport;
  HFDB.saveReports=saveReports;
})(window);
