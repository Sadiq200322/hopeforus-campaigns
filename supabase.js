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
    media=media.filter(function(m){ return m && m.type!=='share' && m.kind!=='share'; });
    return {
      id:r.id, title:r.title||'', story:r.story||'',
      ownerEmail:r.owner_email||'', organizerEmail:r.owner_email||'', organizer:r.organizer||'',
      goal:Number(r.goal)||0, raised:Number(r.raised)||0, donations:Number(r.donations)||0,
      image:img, image_url:img,
      media:media,
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
        try{ return JSON.parse(t); }catch(e){ return row; }
      });
    });
  }
  function update(id, patch){
    return fetch(URL+'/rest/v1/campaigns?id=eq.'+encodeURIComponent(id),{
      method:'PATCH',
      headers:headers({'Content-Type':'application/json','Prefer':'return=representation'}),
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
  function remove(id){
    return update(id, {status:'deleted'}).catch(function(){
      return fetch(URL+'/rest/v1/campaigns?id=eq.'+encodeURIComponent(id),{
        method:'DELETE',
        headers:headers({'Prefer':'return=minimal'})
      });
    });
  }
  w.HFDB={url:URL, save:save, update:update, remove:remove, list:list, one:one, upload:upload, campFrom:campFrom, rowFrom:rowFrom};
})(window);
