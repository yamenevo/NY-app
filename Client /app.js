const $=s=>document.querySelector(s),app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const K={activity:['🎲','فعالية','activities'],bold:['🔥','جريء','boldActivities'],question:['❓','سؤال','questions'],challenge:['⚡','تحدي','challenges'],
 love:['💌','رسالة حب','loveMessages'],honesty:['💬','صراحة','honestyQuestions'],poem:['📜','إهداء شعري','poems'],gift:['🎁','هدية','gifts'],song:['🎵','أغنية','songs']};
const EM=['❤️','😍','🔥','💋','👏'],MOODS=['😊','🥰','😢','😍','😔','😴'],ANG=['🙂','😐','😠','😡','💔'];
const S={code:localStorage.code,name:localStorage.name,room:null,online:[],cur:null,mood:MOODS[0],anger:ANG[0],imgs:[],open:false};
const socket=io(),pick=a=>a[Math.floor(Math.random()*a.length)];
const when=t=>new Date(t).toLocaleString('ar',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const page=()=>location.hash.replace(/^#\/?/,'');
const up=(l,e)=>{const i=l.findIndex(x=>x.id===e.id);i<0?l.unshift(e):l[i]=e};
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),3000)}
function auth(r){if(r.error){S.room=null;toast(r.error);return route()}S.room=r.room;S.code=r.room.code;
  localStorage.code=S.code;localStorage.name=S.name;route()}
socket.on('connect',()=>{if(S.code&&S.name)socket.emit('join',{code:S.code,name:S.name},r=>{if(r.error){S.code=null;localStorage.removeItem('code')}auth(r)});else route()});
socket.on('presence',o=>{S.online=o;if(!page())route()});
socket.on('toast',toast);
socket.on('stats',s=>{S.room.stats=s;if(!page())route()});
socket.on('action',({type,payload,from})=>{const o=document.createElement('div');o.className='ov';o.dataset.a='close';
  o.innerHTML=`<div class="card"><small>${esc(from)} ${esc(K[type][0])}</small><br>${esc(payload)}<br><br><small>اضغط للإغلاق</small></div>`;document.body.append(o)});
socket.on('diary-entry',e=>{up(S.room.diary,e);if(page()==='diary')list();if(e.from!==S.name)toast('📔 '+e.from)});
socket.on('diary-removed',i=>{S.room.diary=S.room.diary.filter(e=>e.id!==i);if(page()==='diary')list()});
socket.on('fight-entry',e=>{up(S.room.fights,e);if(page()==='fights')list()});

const head=t=>`<div class="hd"><a href="#/">→</a><b>${t}</b><span style="width:20px"></span></div>`;
function route(){const h=page();
  if(!S.room)return S.code?app.innerHTML='<div class="empty">جاري الاتصال...</div>':login();
  if(h==='diary')return diary();if(h==='fights')return fights();if(K[h])return content(h);home()}
addEventListener('hashchange',route);

function login(){app.innerHTML=`<div class="login"><h1>NY</h1><p style="color:var(--mut)">مساحتنا الخاصة</p><br>
<input id="n" placeholder="اسمك" maxlength="20" value="${esc(S.name||'')}"><input id="c" placeholder="رمز الغرفة NY-XXXX (للانضمام)" maxlength="9" style="text-transform:uppercase">
<button class="btn" data-a="create">إنشاء غرفة جديدة</button><button class="btn2" data-a="joinroom">الانضمام لغرفة</button></div>`}
function home(){const s=S.room.stats;
  app.innerHTML=`<div class="top"><span>NY <b>${esc(S.code)}</b> 📋</span><span>${S.online.length>1?'🟢 متصل':'⚪ غير متصل'}</span></div>
<div class="grid"><a href="#/diary">📔<span>يومياتي</span></a><a href="#/fights">💢<span>عاتبني</span></a>
${Object.entries(K).map(([k,v])=>`<a href="#/${k}">${v[0]}<span>${v[1]}</span></a>`).join('')}</div>
<div class="stats"><div><b>${s.count}</b>فعاليات</div><div><b>${s.qCount}</b>أسئلة</div><div><b>${s.pCount}</b>أشعار</div></div>
<button class="btn2" data-a="notif">🔔 تفعيل الإشعارات</button>`}
const fmt=(k,i)=>k==='poem'?`📜 ${i.author}:\n«${i.text}»`:k==='gift'?`🎁 ${i.emoji} ${i.name}`:k==='song'?`🎵 ${i}`:k==='love'?`💌 ${i}`:i;
function content(k){S.cur=null;app.innerHTML=head(K[k][0]+' '+K[k][1])+`<div class="card" id="card">اضغط «جديد»</div>
<div class="row2"><button class="btn" data-a="gen" data-k="${k}">جديد</button><button class="btn2" data-a="send" data-k="${k}">إرسال 💌</button></div>`}

function diary(){app.innerHTML=head('📔 يومياتي')+`<button class="btn2" data-a="toggle">＋ جديدة</button>
<div id="comp" ${S.open?'':'hidden'}><input id="t" placeholder="العنوان" maxlength="60"><textarea id="x" rows="4" placeholder="كيف كان يومك؟"></textarea>
<div class="rx mood">${MOODS.map(m=>`<button data-a="mood" data-m="${m}" class="${m===S.mood?'on':''}">${m}</button>`).join('')}</div>
<input type="file" id="files" accept="image/*" multiple><div id="prev"></div><button class="btn" data-a="savediary">حفظ</button></div><div id="list"></div>`;list()}
function fights(){app.innerHTML=head('💢 عاتبني')+`<button class="btn2" data-a="toggle">＋ عتاب جديد</button>
<div id="comp" ${S.open?'':'hidden'}><input id="t" placeholder="العنوان" maxlength="60"><textarea id="x" rows="5" placeholder="فضفض هنا..."></textarea>
<div class="rx mood">${ANG.map(m=>`<button data-a="anger" data-m="${m}" class="${m===S.anger?'on':''}">${m}</button>`).join('')}</div>
<button class="btn" data-a="savefight">أرسل</button></div><div id="list"></div>`;list()}
function list(){const el=$('#list');if(!el)return;const d=page()==='diary',a=d?S.room.diary:S.room.fights;
  el.innerHTML=a.length?a.map(d?dEntry:fEntry).join(''):`<div class="empty">${d?'📔 لا توجد يوميات بعد':'💢 لا عتاب بينكما، العلاقة بخير!'}</div>`}
const who=e=>e.from===S.name?'أنت':e.from;
function dEntry(e){const me=S.name,cnt={};Object.values(e.reactions).forEach(m=>cnt[m]=(cnt[m]||0)+1);
  return `<div class="card2"><div class="row"><b>${esc(who(e))}</b><span>${esc(e.mood)}</span></div><h4>${esc(e.title)}</h4><p>${esc(e.text)}</p>
<div>${e.images.map(s=>`<img src="${esc(s)}">`).join('')}</div>
<div class="rx">${EM.map(m=>`<button data-a="react" data-id="${esc(e.id)}" data-e="${m}" class="${e.reactions[me]===m?'on':''}">${m} ${cnt[m]||''}</button>`).join('')}</div>
${e.comments.map(c=>`<div class="cm"><b>${esc(c.from)}</b> ${esc(c.text)}</div>`).join('')}
<div class="row"><input id="c${esc(e.id)}" placeholder="تعليق..."><button class="btn2" style="width:auto" data-a="comment" data-id="${esc(e.id)}">↩</button></div>
<small>${when(e.time)} ${e.from===me?`<a href="#" data-a="del" data-id="${esc(e.id)}">حذف</a>`:''}</small></div>`}
function fEntry(e){return `<div class="card2" ${e.resolved?'style="opacity:.6"':''}><div class="row"><b>${esc(who(e))}</b><span>${esc(e.anger)}</span></div><h4>${esc(e.title)}</h4><p>${esc(e.text)}</p>
${e.replies.map(c=>`<div class="cm"><b>${esc(c.from)}</b> ${esc(c.text)}</div>`).join('')}
<div class="row"><input id="c${esc(e.id)}" placeholder="رد..."><button class="btn2" style="width:auto" data-a="reply" data-id="${esc(e.id)}">↩</button></div>
<small>${when(e.time)}</small>${e.resolved?'<b style="color:#6fbf73"> ✓ تم الصلح</b>':e.from!==S.name?`<button class="btn" data-a="resolve" data-id="${esc(e.id)}">💞 تم الصلح</button>`:''}</div>`}

function shrink(f){return new Promise(r=>{const im=new Image();im.onload=()=>{const s=Math.min(1,1024/Math.max(im.width,im.height)),c=document.createElement('canvas');
  c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.75))};im.src=URL.createObjectURL(f)})}
app.addEventListener('change',async e=>{if(e.target.id!=='files')return;
  for(const f of[...e.target.files].slice(0,4-S.imgs.length))S.imgs.push(await shrink(f));
  $('#prev').innerHTML=S.imgs.map(s=>`<img src="${s}" style="width:30%;margin:4px;border-radius:8px">`).join('')});
const val=id=>$('#'+id).value.trim(),close=()=>{S.open=false;S.imgs=[];route()};
const A={
 create(){S.name=val('n');if(!S.name)return toast('اكتب اسمك');socket.emit('create',{name:S.name},auth)},
 joinroom(){S.name=val('n');S.code=val('c').toUpperCase();if(!S.name||!S.code)return toast('اكتب الاسم والرمز');socket.emit('join',{code:S.code,name:S.name},auth)},
 gen(d){const k=d.k,i=pick(LoveData[K[k][2]]);S.cur=fmt(k,i);const c=$('#card');c.textContent=S.cur;
  if(k==='song'){const a=document.createElement('a');a.href='https://www.youtube.com/results?search_query='+encodeURIComponent(i);a.target='_blank';a.textContent='▶ يوتيوب';a.style.color='#fff';c.append(document.createElement('br'),a)}},
 send(d){if(!S.cur)return toast('اضغط «جديد» أولاً');socket.emit('action',{type:d.k,payload:S.cur});toast('تم الإرسال 💌')},
 close(d,b){b.remove()},toggle(){S.open=!S.open;$('#comp').hidden=!S.open},
 mood(d){S.mood=d.m;diary()},anger(d){S.anger=d.m;S.open=true;fights()},
 savediary(){const title=val('t'),text=val('x');if(!title&&!text)return toast('اكتب شيئاً');socket.emit('diary-add',{entry:{title,text,mood:S.mood,images:S.imgs}});close()},
 savefight(){const title=val('t'),text=val('x');if(!title&&!text)return toast('اكتب عتابك');socket.emit('fight-add',{entry:{title,text,anger:S.anger}});close()},
 react(d){socket.emit('diary-react',{id:d.id,emoji:d.e})},
 del(d){if(confirm('حذف اليومية؟'))socket.emit('diary-delete',{id:d.id})},
 comment(d){const i=$('#c'+d.id);if(i.value.trim())socket.emit('diary-comment',{id:d.id,text:i.value})},
 reply(d){const i=$('#c'+d.id);if(i.value.trim())socket.emit('fight-reply',{id:d.id,text:i.value})},
 resolve(d){socket.emit('fight-resolve',{id:d.id,resolved:true})},
 async notif(){try{const {key}=await (await fetch('/api/vapid')).json();if(!key)return toast('مفاتيح VAPID غير مضبوطة في السيرفر');
  if(await Notification.requestPermission()!=='granted')return toast('لم يتم السماح');
  const reg=await navigator.serviceWorker.ready,pad='='.repeat((4-key.length%4)%4),b=atob((key+pad).replace(/-/g,'+').replace(/_/g,'/'));
  const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:Uint8Array.from(b,c=>c.charCodeAt(0))});
  await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:S.code,name:S.name,sub})});toast('تم تفعيل الإشعارات 🔔')}
  catch(e){toast('على iPad: أضف التطبيق للشاشة الرئيسية أولاً')}}
};
app.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a]){e.preventDefault();A[b.dataset.a](b.dataset,b)}});
document.addEventListener('click',e=>{const b=e.target.closest('.ov');if(b)b.remove()});
