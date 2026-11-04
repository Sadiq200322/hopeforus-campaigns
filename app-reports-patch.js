/* HopeForUs – reports + admin email alerts (loads after app.js) */
(function(w){
  if(!w.HF) return;
  var REPORTS_KEY='hopeforus_reports';
  var ADMIN_EMAIL=w.HF.ADMIN_EMAIL||'admin@hopeforus.com';
  function load(k,d){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

  function notifyAdmin(subject, body){
    try{
      var cfg=w.HOPEFORUS_EMAILJS||{};
      var adminTo=cfg.reportEmail||ADMIN_EMAIL||'admin@hopeforus.com';
      if(typeof emailjs==='undefined'||!cfg.publicKey||!cfg.serviceId||!cfg.templateId||cfg.publicKey==='YOUR_PUBLIC_KEY') return false;
      if(!w.__emailjs_inited){ emailjs.init({publicKey:cfg.publicKey}); w.__emailjs_inited=true; }
      emailjs.send(cfg.serviceId, cfg.templateId, {
        to_email:adminTo, email:adminTo,
        user_name:'HopeForUs Admin', name:'HopeForUs Admin',
        otp_code:String(subject||'ALERT').slice(0,40),
        passcode:String(subject||'ALERT').slice(0,40),
        site_name:String(body||'').slice(0,1500)
      }).catch(function(){});
      return true;
    }catch(e){ return false; }
  }

  function listReports(){
    var list=load(REPORTS_KEY,[]); if(!Array.isArray(list)) list=[];
    return list.slice().sort(function(a,b){ return (b.at||0)-(a.at||0); });
  }

  function submitReport(payload){
    payload=payload||{};
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
      status:'open',
      at:payload.at||Date.now()
    };
    var list=load(REPORTS_KEY,[]); if(!Array.isArray(list)) list=[];
    list.unshift(row);
    if(list.length>300) list=list.slice(0,300);
    save(REPORTS_KEY,list);
    if(w.HFDB&&HFDB.addReport){ HFDB.addReport(row).catch(function(){}); }
    notifyAdmin('REPORT', [
      'REPORT on HopeForUs',
      'Campaign: '+(row.campaignTitle||row.campaignId),
      'Campaign ID: '+row.campaignId+' / '+row.campaignCode,
      'Ticket: '+row.id,
      'Reason: '+row.reason,
      'Reporter: '+row.name+' <'+row.email+'>',
      'Address: '+(row.address||'—'),
      '',
      'Details:',
      row.details,
      '',
      'Evidence links:',
      row.links||'(none)'
    ].join('\n'));
    return {ok:true,row:row};
  }

  function resolveReport(id, status){
    id=String(id||'');
    status=String(status||'resolved').toLowerCase();
    var list=load(REPORTS_KEY,[]); if(!Array.isArray(list)) list=[];
    var i=list.findIndex(function(x){return x&&x.id===id});
    if(i<0) return {ok:false,err:'Not found'};
    list[i].status=status; list[i].resolvedAt=Date.now();
    save(REPORTS_KEY,list);
    if(w.HFDB&&HFDB.saveReports){ HFDB.saveReports(list).catch(function(){}); }
    return {ok:true,row:list[i]};
  }

  var _confirm=w.HF.confirmSignup;
  if(typeof _confirm==='function'){
    w.HF.confirmSignup=function(code){
      var r=_confirm(code);
      if(r&&r.ok){
        try{
          var s=w.HF.session&&w.HF.session();
          notifyAdmin('NEW USER', 'New registration on HopeForUs\nName: '+(s&&s.name||'')+'\nEmail: '+(s&&s.email||'')+'\nTime: '+new Date().toISOString());
        }catch(e){}
      }
      return r;
    };
  }

  var _save=w.HF.saveCampaign;
  if(typeof _save==='function'){
    w.HF.saveCampaign=function(c){
      var list=load('hopeforus_campaigns',[]);
      var isNew=!list.some(function(x){return x&&c&&x.id===c.id;});
      var r=_save(c);
      if(r&&r.ok&&isNew&&c&&String(c.status||'pending')==='pending'){
        try{
          notifyAdmin('CAMPAIGN PENDING', [
            'New campaign waiting for approval',
            'Title: '+(c.title||'—'),
            'Owner: '+(c.ownerEmail||c.organizerEmail||c.organizer||'—'),
            'Goal: $'+(Number(c.goal)||0),
            'ID: '+c.id+(c.code?(' / '+c.code):''),
            'Open admin dashboard → Approve to review.'
          ].join('\n'));
        }catch(e){}
      }
      return r;
    };
  }

  w.HF.listReports=listReports;
  w.HF.submitReport=submitReport;
  w.HF.resolveReport=resolveReport;
  w.HF.notifyAdmin=notifyAdmin;
})(window);
