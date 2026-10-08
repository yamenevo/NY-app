const express=require('express'),http=require('http'),{Server}=require('socket.io'),fs=require('fs'),path=require('path'),crypto=require('crypto');
let webpush=null;
try{const w=require('web-push');if(process.env.VAPID_PUBLIC&&process.env.VAPID_PRIVATE){w.setVapidDetails('mailto:ny@example.com',process.env.VAPID_PUBLIC,process.env.VAPID_PRIVATE);webpush=w}}catch{}
// حفظ دائم في ملف JSON (على Render استخدم Disk وضع DATA_FILE=/data/data.json)
const DB=process.env.DATA_FILE||path.join(__dirname,'data.json');
let rooms={};try{rooms=JSON.parse(fs.readFileSync(DB,'utf8'))}catch{}
let dirty=false;const save=()=>{dirty=true};
setInterval(()=>{if(!dirty)return;dirty=false;fs.writeFile(DB,JSON.stringify(rooms),()=>{})},3000);

const app=express(),server=http.createServer(app),io=new Server(server,{maxHttpBufferSize:1e7});
app.use(express.json({limit:'100kb'}));
app.use(express.static(path.join(__dirname,'../client')));
app.get('/api/vapid',(q,s)=>s.json({key:webpush?process.env.VAPID_PUBLIC:null}));
app.post('/api/subscribe',(q,s)=>{const{code,name,sub}=q.body||{};const r=rooms[code];
  if(!r||!r.users.includes(name)||!sub||!sub.endpoint)return s.sendStatus(400);
  r.subs=(r.subs||[]).filter(x=>x.sub.endpoint!==sub.endpoint);r.subs.push({name,sub});save();s.json({ok:1})});

const id=()=>crypto.randomBytes(6).toString('hex');
const str=(v,n)=>typeof v==='string'?v.slice(0,n):'';
const newCode=()=>{const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let x;do{x='NY-'+Array.from({length:4},()=>c[crypto.randomInt(c.length)]).join('')}while(rooms[x]);return x};
async function push(r,from,p){if(!webpush)return;for(const s of[...(r.subs||[])]){if(s.name===from)continue;
  try{await webpush.sendNotification(s.sub,JSON.stringify(p))}catch(e){if(e.statusCode===404||e.statusCode===410){r.subs=r.subs.filter(x=>x!==s);save()}}}}
async function presence(code){const ss=await io.in(code).fetchSockets();io.to(code).emit('presence',[...new Set(ss.map(s=>s.data.name))])}
const view=r=>({code:r.code,users:r.users,stats:r.stats,diary:r.diary,fights:r.fights});
const TYPES={activity:'count',bold:'count',challenge:'count',love:'count',gift:'count',song:'count',question:'qCount',honesty:'qCount',poem:'pCount'};
const okImg=s=>typeof s==='string'&&s.startsWith('data:image/jpeg;base64,')&&s.length<2.5e6;

io.on('connection',sock=>{
  const enter=(r,name)=>{sock.data={code:r.code,name};sock.join(r.code);presence(r.code)};
  const on=(ev,fn)=>sock.on(ev,(d)=>{const r=rooms[sock.data.code];if(r)fn(r,sock.data.name,d||{})});

  sock.on('create',({name}={},cb)=>{name=str(name,20).trim();if(!name)return cb({error:'اكتب اسمك'});
    const code=newCode();const r=rooms[code]={code,users:[name],stats:{count:0,qCount:0,pCount:0},diary:[],fights:[],subs:[]};
    save();enter(r,name);cb({room:view(r)})});

  // الهوية بالاسم لا بمعرّف السوكت: يمكن الدخول من جديد بعد إغلاق التطبيق أو تحديث الصفحة
  sock.on('join',({code,name}={},cb)=>{const r=rooms[str(code,9).toUpperCase()];name=str(name,20).trim();
    if(!r)return cb({error:'الغرفة غير موجودة'});if(!name)return cb({error:'اكتب اسمك'});
    if(!r.users.includes(name)){if(r.users.length>=2)return cb({error:'الغرفة ممتلئة'});r.users.push(name);save()}
    enter(r,name);cb({room:view(r)});sock.to(r.code).emit('toast',name+' انضم');});

  on('action',(r,me,{type,payload})=>{if(!TYPES[type])return;payload=str(payload,500);if(!payload)return;
    r.stats[TYPES[type]]++;save();io.to(r.code).emit('stats',r.stats);
    sock.to(r.code).emit('action',{type,payload,from:me});
    push(r,me,{title:'NY — '+me,body:payload.slice(0,80),url:'/'})});

  on('diary-add',(r,me,{entry:e={}})=>{const x={id:id(),from:me,time:Date.now(),title:str(e.title,60)||'بدون عنوان',text:str(e.text,5000),
      mood:str(e.mood,4),images:(Array.isArray(e.images)?e.images:[]).slice(0,4).filter(okImg),reactions:{},comments:[]};
    r.diary.unshift(x);r.diary=r.diary.slice(0,200);save();io.to(r.code).emit('diary-entry',x);
    push(r,me,{title:'📔 يومية جديدة',body:me+': '+x.title,url:'/#/diary'})});
  on('diary-delete',(r,me,{id:i})=>{const n=r.diary.length;r.diary=r.diary.filter(e=>!(e.id===i&&e.from===me));
    if(r.diary.length!==n){save();io.to(r.code).emit('diary-removed',i)}});
  on('diary-react',(r,me,{id:i,emoji})=>{const e=r.diary.find(x=>x.id===i);if(!e)return;emoji=str(emoji,4);
    if(e.reactions[me]===emoji)delete e.reactions[me];else e.reactions[me]=emoji;save();io.to(r.code).emit('diary-entry',e);
    if(e.from!==me&&e.reactions[me])push(r,me,{title:'NY',body:me+' تفاعل مع يوميتك '+emoji,url:'/#/diary'})});
  on('diary-comment',(r,me,{id:i,text})=>{const e=r.diary.find(x=>x.id===i);text=str(text,500);if(!e||!text)return;
    e.comments.push({id:id(),from:me,text,time:Date.now()});save();io.to(r.code).emit('diary-entry',e);
    push(r,me,{title:'💬 تعليق جديد',body:me+': '+text.slice(0,60),url:'/#/diary'})});

  on('fight-add',(r,me,{entry:e={}})=>{const x={id:id(),from:me,time:Date.now(),title:str(e.title,60)||'عتاب',text:str(e.text,3000),
      anger:str(e.anger,4),replies:[],resolved:false};
    r.fights.unshift(x);r.fights=r.fights.slice(0,100);save();io.to(r.code).emit('fight-entry',x);
    push(r,me,{title:'💢 عتاب جديد',body:me+': '+x.title,url:'/#/fights'})});
  on('fight-reply',(r,me,{id:i,text})=>{const f=r.fights.find(x=>x.id===i);text=str(text,1000);if(!f||!text)return;
    f.replies.push({id:id(),from:me,text,time:Date.now()});save();io.to(r.code).emit('fight-entry',f);
    push(r,me,{title:'رد على العتاب',body:me+': '+text.slice(0,60),url:'/#/fights'})});
  on('fight-resolve',(r,me,{id:i,resolved})=>{const f=r.fights.find(x=>x.id===i);if(!f)return;f.resolved=!!resolved;save();
    io.to(r.code).emit('fight-entry',f);if(f.resolved)push(r,me,{title:'💞 تم الصلح',body:me+' قبل الصلح',url:'/#/fights'})});

  sock.on('disconnect',()=>{if(sock.data.code)presence(sock.data.code)});
});
server.listen(process.env.PORT||3000,()=>console.log('NY v3 running'));
