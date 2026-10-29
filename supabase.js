/* HopeForUs shared store. Publishable key is meant for the browser. */
(function(w){
  var URL='https://dmvldmffdwzgqnjfrrww.supabase.co';
  var KEY='sb_publishable_hSBxsefa3AzA7sLngR07Vw_ruW60q_h';
  function headers(extra){
    var h={'apikey':KEY,'Authorization':'Bearer '+KEY};
    if(extra) Object.keys(extra).forEach(function(k){ h[k]=extra[k]; });
    return h;
  }
  function codeFromMedia(media){
    if(!Array.isArray(media)) return '';
    for(var i=0;i<media.length;i++){
      var m=media[i];
      if(m && (m.type==='share' || m.kind==='share') && m.code) return String(m.code);
    }
    return '';
  }
  function withShare(media, code){
    var list=Array.isArray(media)?media.slice():[];
    if(!code) return list;
    var has=false;
    list.forEach(function(m){ if(m && (m.type==='share' || m.kind==='share')){ m.code=String(code); has=true; } });
    if(!has) list.push({type:'share', code:String(code)});
    return list;
  }
  function rowFrom(c){
    return {
      id:c.id,
      title:c.title||'',
      story:c.story||'',
      owner_email:c.ownerEmail||c.organizerEmail||'',
      organizer:c.organizer||'',
      goal:Number(c.goal)||0,
      raised:Number(c.raised)||0,
      donations:Number(c.donations)||0,
      image_url:c.image_url||c.image||'',
      media:withShare(Array.isArray(c.media)?c.media:[], c.code||''),
      status:c.status||'pending',
      donation_link:c.donationLink||c.donation_link||'',
      created_at:c.createdAt||c.created_at||new Date().toISOString()
    };
  }
  function campFrom(r){
    if(!r) return null;
    var img=r.image_url||'';
    if(String(img).indexOf('data:')===0) img='';
    var media=Array.isArray(r.media)?r.media:[];
    if(!img){
      for(var i=0;i<media.length;i++){
        var m=media[i];
        var u=(m&&(m.url||m.dataUrl))||'';
        if(String(u).indexOf('http')===0){ img=u; break; }
      }
    }
    var giftDonors=[];
    var giftSum=0;
    var orgAv='';
    media.forEach(function(m){
      if(!m) return;
      if(m.type==='gift'){
        var amt=Number(m.amount)||0;
        giftSum+=amt;
        giftDonors.push({name:m.donor||m.name||'Anonymous', amount:amt, note:m.note||'', giftId:m.id||'', time:''});
      }
      if(m.type==='avatar' && (m.url||m.dataUrl)) orgAv=m.url||m.dataUrl;
    });
    media=media.filter(function(m){ return m && m.type!=='share' && m.kind!=='share' && m.type!=='gift' && m.type!=='avatar'; });
    var raised=Math.max(Number(r.raised)||0, giftSum);
    var donations=Math.max(Number(r.donations)||0, giftDonors.length);
    return {
      id:r.id, title:r.title||'', story:r.story||'',
      ownerEmail:r.owner_email||'', organizerEmail:r.owner_email||'', organizer:r.organizer||'',
      goal:Number(r.goal)||0, raised:raised, donations:donations,
      image:img, image_url:img,
      media:media,
      donors:giftDonors,
      organizerAvatar:orgAv, ownerAvatar:orgAv,
      status:r.status||'pending', donationLink:r.donation_link||'',
      code:codeFromMedia(r.media)||'',
      createdAt:r.created_at||''
    };
  }
  function blobFrom(dataUrl){
    var parts=String(dataUrl).split(',');
    var mime=(parts[0].match(/:(.*?);/)||[])[1]||'application/octet-stream';
    var bin=atob(parts[1]||'');
    var arr=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
    return new Blob([arr],{type:mime});
  }
  function upload(dataUrl, name){
    if(!dataUrl) return Promise.resolve('');
    if(String(dataUrl).indexOf('http')===0) return Promise.resolve(dataUrl);
    if(String(dataUrl).indexOf('data:')!==0) return Promise.resolve('');
    var blob=blobFrom(dataUrl);
    var path=name||('m_'+Date.now().toString(36));
    return fetch(URL+'/storage/v1/object/campaign-media/'+path,{
      method:'POST',
      headers:headers({'Content-Type':blob.type,'x-upsert':'true'}),
      body:blob
    }).then(function(r){
      if(!r.ok) return r.text().then(function(t){ throw new Error(t||'upload failed'); });
      return URL+'/storage/v1/object/public/campaign-media/'+path;
    });
  }
  function save(c){
    var row=rowFrom(c);
    return fetch(URL+'/rest/v1/campaigns?on_conflict=id',{
      method:'POST',
      headers:headers({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=representation'}),
      body:JSON.stringify(row)
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok) throw new Error(t||'save failed');
        try{ return JSON.parse(t); }catch(e){ return t; }
      });
    });
  }
  function update(id, patch){
    return fetch(URL+'/rest/v1/campaigns?id=eq.'+encodeURIComponent(id),{
      method:'PATCH',
      headers:headers({'Content-Type':'application/json','Prefer':'return=minimal'}),
      body:JSON.stringify(patch)
    }).then(function(r){
      return r.text().then(function(t){ if(!r.ok) throw new Error(t||'update failed'); return t; });
    });
  }
  function list(){
    return fetch(URL+'/rest/v1/campaigns?select=*&order=created_at.desc',{headers:headers()}).then(function(r){
      return r.json().then(function(data){
        if(!r.ok) throw new Error((data&&data.message)||'list failed');
        return (data||[]).map(campFrom);
      });
    });
  }
  function one(id){
    return fetch(URL+'/rest/v1/campaigns?id=eq.'+encodeURIComponent(id)+'&select=*',{headers:headers()}).then(function(r){
      return r.json().then(function(data){
        if(!r.ok) throw new Error((data&&data.message)||'load failed');
        return data&&data[0]?campFrom(data[0]):null;
      });
    });
  }
  function findOwner(email){
    email=String(email||'').toLowerCase().trim();
    if(!email) return Promise.resolve(null);
    return fetch(URL+'/rest/v1/campaigns?owner_email=eq.'+encodeURIComponent(email)+'&status=neq.deleted&select=id,organizer,owner_email&limit=1',{headers:headers()}).then(function(r){
      return r.json().then(function(data){
        if(!r.ok || !data || !data[0]) return null;
        return {email:email, name:data[0].organizer||email.split('@')[0]};
      });
    }).catch(function(){ return null; });
  }
  function remove(id){
    return update(id, {status:'deleted'}).catch(function(){
      return fetch(URL+'/rest/v1/campaigns?id=eq.'+encodeURIComponent(id),{
        method:'DELETE',
        headers:headers({'Prefer':'return=minimal'})
      });
    });
  }
  function publishDonors(id, donors){
    var list=(donors||[]).slice(0,40).map(function(d){
      return {name:d.name||d.donor||'Anonymous', amount:Number(d.amount)||0, note:d.note||'', giftId:d.giftId||d.id||'', time:d.time||''};
    });
    return fetch(URL+'/storage/v1/object/campaign-media/donors/'+encodeURIComponent(id)+'.json',{
      method:'POST',
      headers:headers({'Content-Type':'application/json','x-upsert':'true'}),
      body:JSON.stringify(list)
    });
  }
  function loadDonors(id){
    return fetch(URL+'/storage/v1/object/public/campaign-media/donors/'+encodeURIComponent(id)+'.json?t='+Date.now(),{cache:'no-store'}).then(function(r){
      if(!r.ok) return [];
      return r.json().then(function(data){ return Array.isArray(data)?data:[]; }).catch(function(){ return []; });
    }).catch(function(){ return []; });
  }
  function upsertProfile(p){
    if(!p||!p.email) return Promise.reject(new Error('email required'));
    var row={
      email:String(p.email).toLowerCase().trim(),
      name:p.name||'',
      whatsapp:p.whatsapp||'',
      avatar_url:p.avatar_url||p.avatar||'',
      is_admin:!!(p.is_admin||p.isAdmin),
      updated_at:new Date().toISOString()
    };
    if(p.created_at) row.created_at=p.created_at;
    return fetch(URL+'/rest/v1/profiles?on_conflict=email',{
      method:'POST',
      headers:headers({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=representation'}),
      body:JSON.stringify(row)
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok) throw new Error(t||'profile save failed');
        try{ return JSON.parse(t); }catch(e){ return row; }
      });
    });
  }
  function listProfiles(){
    return fetch(URL+'/rest/v1/profiles?select=*&order=created_at.desc',{headers:headers()}).then(function(r){
      return r.json().then(function(data){
        if(!r.ok) throw new Error((data&&data.message)||'list profiles failed');
        return (data||[]).map(function(x){
          return {
            email:x.email,
            name:x.name||'',
            whatsapp:x.whatsapp||'',
            avatar:x.avatar_url||'',
            avatar_url:x.avatar_url||'',
            isAdmin:!!x.is_admin,
            verified:true,
            created:x.created_at?Date.parse(x.created_at):0,
            id:'p_'+String(x.email||'').replace(/[^a-z0-9]/gi,'_')
          };
        });
      });
    });
  }
  function getProfile(email){
    email=String(email||'').toLowerCase().trim();
    if(!email) return Promise.resolve(null);
    return fetch(URL+'/rest/v1/profiles?email=eq.'+encodeURIComponent(email)+'&select=*&limit=1',{headers:headers()}).then(function(r){
      return r.json().then(function(data){
        if(!r.ok||!data||!data[0]) return null;
        var x=data[0];
        return {
          email:x.email, name:x.name||'', whatsapp:x.whatsapp||'',
          avatar:x.avatar_url||'', avatar_url:x.avatar_url||'',
          isAdmin:!!x.is_admin, verified:true,
          created:x.created_at?Date.parse(x.created_at):0
        };
      });
    }).catch(function(){ return null; });
  }
  w.HFDB={url:URL, save:save, update:update, remove:remove, list:list, one:one, upload:upload, campFrom:campFrom, rowFrom:rowFrom, findOwner:findOwner, publishDonors:publishDonors, loadDonors:loadDonors, upsertProfile:upsertProfile, listProfiles:listProfiles, getProfile:getProfile};
})(window);
