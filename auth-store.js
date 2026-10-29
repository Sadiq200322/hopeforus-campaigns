/* Shared cross-device password store (no email confirmation required) */
(function(w){
  if(!w.HFDB) return;
  var URL=w.HFDB.url;
  var KEY='sb_publishable_hSBxsefa3AzA7sLngR07Vw_ruW60q_h';
  function headers(extra){
    var h={'apikey':KEY,'Authorization':'Bearer '+KEY};
    if(extra) Object.keys(extra).forEach(function(k){ h[k]=extra[k]; });
    return h;
  }
  function putJson(path, data){
    return fetch(URL+'/storage/v1/object/campaign-media/'+path,{ method:'POST', headers:headers({'Content-Type':'application/json','x-upsert':'true'}), body:JSON.stringify(data) }).then(function(r){
      return r.text().then(function(txt){ if(!r.ok) throw new Error(txt||'storage write failed'); return data; });
    });
  }
  function getJson(path){
    return fetch(URL+'/storage/v1/object/public/campaign-media/'+path+'?t='+Date.now(),{cache:'no-store'}).then(function(r){
      if(!r.ok) return null;
      return r.json().catch(function(){ return null; });
    }).catch(function(){ return null; });
  }
  function accountPath(email){
    email=String(email||'').toLowerCase().trim();
    return 'auth/u_'+email.replace(/[^a-z0-9]/g,'_')+'.json';
  }
  function hashPass(s){ var h=0,i,c; s=String(s||''); for(i=0;i<s.length;i++){ c=s.charCodeAt(i); h=((h<<5)-h)+c; h=h&h; } return 'h'+Math.abs(h).toString(16); }
  function registerAccount(email, password, name){
    email=String(email||'').toLowerCase().trim();
    if(!email||!password) return Promise.reject(new Error('email and password required'));
    var row={ email:email, pass:hashPass(password), name:name||'', at:Date.now() };
    var path=accountPath(email);
    var alt=path.replace(/\.json$/,'_r.json');
    return getJson(path).then(function(existing){
      if(existing&&existing.pass){
        return putJson(alt, row).catch(function(){ return row; }).then(function(){ return row; });
      }
      return putJson(path, row).catch(function(){
        return putJson(alt, row).catch(function(){ return row; });
      }).then(function(){ return row; });
    });
  }
  function verifyAccount(email, password){
    email=String(email||'').toLowerCase().trim();
    var want=hashPass(password);
    var path=accountPath(email);
    var alt=path.replace(/\.json$/,'_r.json');
    return getJson(path).then(function(row){
      if(row&&row.pass===want) return row;
      return getJson(alt).then(function(row2){
        if(row2&&row2.pass===want) return row2;
        throw new Error('Invalid email or password');
      });
    });
  }
  w.HFDB.registerAccount=registerAccount;
  w.HFDB.verifyAccount=verifyAccount;
})(window);
