const express = require('express'),
  http = require('http'),
  { Server } = require('socket.io'),
  fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');

let webpush = null;
try {
  const w = require('web-push');
  if (process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE) {
    w.setVapidDetails('mailto:ny@example.com', process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);
    webpush = w;
  }
} catch {}

const DB = process.env.DATA_FILE || path.join(__dirname, 'data.json');
let rooms = {};
try { rooms = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch {}
let dirty = false;
const save = () => { dirty = true; };
setInterval(() => {
  if (!dirty) return;
  dirty = false;
  fs.writeFile(DB, JSON.stringify(rooms), () => {});
}, 3000);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e7 });

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../client')));

app.get('/api/vapid', (q, s) => s.json({ key: webpush ? process.env.VAPID_PUBLIC : null }));

app.post('/api/subscribe', (q, s) => {
  const { code, name, sub } = q.body || {};
  const r = rooms[code];
  if (!r || !r.users.includes(name) || !sub || !sub.endpoint) return s.sendStatus(400);
  r.subs = (r.subs || []).filter(x => x.sub.endpoint !== sub.endpoint);
  r.subs.push({ name, sub });
  save();
  s.json({ ok: 1 });
});

const id = () => crypto.randomBytes(6).toString('hex');
const str = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
const okImg = s => typeof s === 'string' && s.startsWith('data:image/') && s.length < 3e6;

const newCode = () => {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let x;
  do {
    x = 'NY-' + Array.from({ length: 4 }, () => c[crypto.randomInt(c.length)]).join('');
  } while (rooms[x]);
  return x;
};

async function push(r, from, p) {
  if (!webpush) return;
  for (const s of [...(r.subs || [])]) {
    if (s.name === from) continue;
    try {
      await webpush.sendNotification(s.sub, JSON.stringify(p));
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        r.subs = r.subs.filter(x => x !== s);
        save();
      }
    }
  }
}

async function presence(code) {
  const ss = await io.in(code).fetchSockets();
  io.to(code).emit('presence', [...new Set(ss.map(s => s.data.name))]);
}

const DEFAULT_PROFILE = {
  avatar: '💎',
  avatarImage: null,
  status: 'أحبك',
  theme: 'gold'
};

const view = r => ({
  code: r.code,
  users: r.users,
  stats: r.stats,
  diary: r.diary || [],
  fights: r.fights || [],
  profiles: r.profiles || {},
  customContent: r.customContent || { activities: [], questions: [], challenges: [], love: [], poems: [] },
  chat: r.chat || []
});

const TYPES = {
  activity: 'count',
  bold: 'count',
  challenge: 'count',
  love: 'count',
  gift: 'count',
  song: 'count',
  question: 'qCount',
  honesty: 'qCount',
  poem: 'pCount'
};

io.on('connection', sock => {
  const enter = (r, name) => {
    sock.data = { code: r.code, name };
    sock.join(r.code);
    presence(r.code);
  };

  const on = (ev, fn) => sock.on(ev, d => {
    const r = rooms[sock.data.code];
    if (r) fn(r, sock.data.name, d || {});
  });

  // ============ إنشاء غرفة ============
  sock.on('create', ({ name } = {}, cb) => {
    name = str(name, 20).trim();
    if (!name) return cb({ error: 'اكتب اسمك' });
    const code = newCode();
    const r = rooms[code] = {
      code,
      users: [name],
      stats: { count: 0, qCount: 0, pCount: 0 },
      diary: [],
      fights: [],
      chat: [],
      subs: [],
      profiles: { [name]: { ...DEFAULT_PROFILE, name } },
      customContent: { activities: [], questions: [], challenges: [], love: [], poems: [] },
      createdAt: Date.now()
    };
    save();
    enter(r, name);
    cb({ room: view(r) });
  });

  // ============ الانضمام لغرفة ============
  sock.on('join', ({ code, name } = {}, cb) => {
    const r = rooms[str(code, 9).toUpperCase()];
    name = str(name, 20).trim();
    if (!r) return cb({ error: 'الغرفة غير موجودة' });
    if (!name) return cb({ error: 'اكتب اسمك' });
    if (!r.profiles) r.profiles = {};
    if (!r.customContent) {
      r.customContent = { activities: [], questions: [], challenges: [], love: [], poems: [] };
    }
    if (!r.users.includes(name)) {
      if (r.users.length >= 2) return cb({ error: 'الغرفة ممتلئة' });
      r.users.push(name);
      r.profiles[name] = { ...DEFAULT_PROFILE, name };
      save();
    }
    if (!r.profiles[name]) {
      r.profiles[name] = { ...DEFAULT_PROFILE, name };
    }
    enter(r, name);
    cb({ room: view(r) });
    sock.to(r.code).emit('toast', name + ' انضم');
  });

  // ============ الأحداث العامة ============
  on('action', (r, me, { type, payload }) => {
    if (!TYPES[type]) return;
    payload = str(payload, 800);
    if (!payload) return;
    r.stats[TYPES[type]]++;
    save();
    io.to(r.code).emit('stats', r.stats);
    sock.to(r.code).emit('action', { type, payload, from: me });
    push(r, me, {
      title: 'NY — ' + me,
      body: payload.slice(0, 80),
      url: '/'
    });
  });

  // ============ اليوميات ============
  on('diary-add', (r, me, { entry: e = {} }) => {
    const x = {
      id: id(),
      from: me,
      time: Date.now(),
      title: str(e.title, 60) || 'بدون عنوان',
      text: str(e.text, 5000),
      mood: str(e.mood, 4),
      images: (Array.isArray(e.images) ? e.images : []).slice(0, 4).filter(okImg),
      reactions: {},
      comments: []
    };
    r.diary.unshift(x);
    r.diary = r.diary.slice(0, 200);
    save();
    io.to(r.code).emit('diary-entry', x);
    push(r, me, { title: '📔 يومية جديدة', body: me + ': ' + x.title, url: '/#/diary' });
  });

  on('diary-delete', (r, me, { id: i }) => {
    const n = r.diary.length;
    r.diary = r.diary.filter(e => !(e.id === i && e.from === me));
    if (r.diary.length !== n) {
      save();
      io.to(r.code).emit('diary-removed', i);
    }
  });

  on('diary-react', (r, me, { id: i, emoji }) => {
    const e = r.diary.find(x => x.id === i);
    if (!e) return;
    emoji = str(emoji, 8);
    if (!e.reactions) e.reactions = {};
    if (e.reactions[me] === emoji) delete e.reactions[me];
    else e.reactions[me] = emoji;
    save();
    io.to(r.code).emit('diary-entry', e);
    if (e.from !== me && e.reactions[me]) {
      push(r, me, { title: 'NY', body: me + ' تفاعل مع يوميتك ' + emoji, url: '/#/diary' });
    }
  });

  on('diary-comment', (r, me, { id: i, text }) => {
    const e = r.diary.find(x => x.id === i);
    text = str(text, 500);
    if (!e || !text) return;
    if (!e.comments) e.comments = [];
    e.comments.push({ id: id(), from: me, text, time: Date.now() });
    save();
    io.to(r.code).emit('diary-entry', e);
    push(r, me, { title: '💬 تعليق جديد', body: me + ': ' + text.slice(0, 60), url: '/#/diary' });
  });

  // ============ العتاب ============
  on('fight-add', (r, me, { entry: e = {} }) => {
    const x = {
      id: id(),
      from: me,
      time: Date.now(),
      title: str(e.title, 60) || 'عتاب',
      text: str(e.text, 3000),
      anger: str(e.anger, 4),
      replies: [],
      resolved: false
    };
    r.fights.unshift(x);
    r.fights = r.fights.slice(0, 100);
    save();
    io.to(r.code).emit('fight-entry', x);
    push(r, me, { title: '💢 عتاب جديد', body: me + ': ' + x.title, url: '/#/fights' });
  });

  on('fight-reply', (r, me, { id: i, text }) => {
    const f = r.fights.find(x => x.id === i);
    text = str(text, 1000);
    if (!f || !text) return;
    if (!f.replies) f.replies = [];
    f.replies.push({ id: id(), from: me, text, time: Date.now() });
    save();
    io.to(r.code).emit('fight-entry', f);
    push(r, me, { title: 'رد على العتاب', body: me + ': ' + text.slice(0, 60), url: '/#/fights' });
  });

  on('fight-resolve', (r, me, { id: i, resolved }) => {
    const f = r.fights.find(x => x.id === i);
    if (!f) return;
    f.resolved = !!resolved;
    save();
    io.to(r.code).emit('fight-entry', f);
    if (f.resolved) {
      push(r, me, { title: '💞 تم الصلح', body: me + ' قبل الصلح', url: '/#/fights' });
    }
  });

  // ============ الملف الشخصي ============
  on('profile-update', (r, me, data) => {
    if (!r.profiles) r.profiles = {};
    const current = r.profiles[me] || { ...DEFAULT_PROFILE };
    const updated = { ...current, name: me };

    if (typeof data.avatar === 'string') updated.avatar = str(data.avatar, 8);
    if (typeof data.status === 'string') updated.status = str(data.status, 50);
    if (typeof data.theme === 'string') updated.theme = str(data.theme, 20);
    if (data.avatarImage === null) updated.avatarImage = null;
    else if (okImg(data.avatarImage)) updated.avatarImage = data.avatarImage;

    r.profiles[me] = updated;
    save();
    io.to(r.code).emit('profiles-updated', r.profiles);
  });

  // ============ المحتوى المخصص ============
  on('content-add', (r, me, { type, text }) => {
    const allowed = ['activities', 'questions', 'challenges', 'love', 'poems'];
    if (!allowed.includes(type)) return;
    text = str(text, 500).trim();
    if (!text) return;
    if (!r.customContent) {
      r.customContent = { activities: [], questions: [], challenges: [], love: [], poems: [] };
    }
    if (!r.customContent[type]) r.customContent[type] = [];
    const item = { id: id(), text, from: me, time: Date.now() };
    r.customContent[type].unshift(item);
    r.customContent[type] = r.customContent[type].slice(0, 100);
    save();
    io.to(r.code).emit('content-updated', r.customContent);
    push(r, me, {
      title: '✨ محتوى جديد',
      body: me + ' أضاف عنصراً جديداً',
      url: '/'
    });
  });

  on('content-delete', (r, me, { type, id: i }) => {
    if (!r.customContent || !r.customContent[type]) return;
    r.customContent[type] = r.customContent[type].filter(x => !(x.id === i && x.from === me));
    save();
    io.to(r.code).emit('content-updated', r.customContent);
  });

  // ============ الدردشة السريعة ============
  on('chat-message', (r, me, { text }) => {
    text = str(text, 500).trim();
    if (!text) return;
    if (!r.chat) r.chat = [];
    const msg = { id: id(), from: me, text, time: Date.now() };
    r.chat.push(msg);
    r.chat = r.chat.slice(-100);
    save();
    io.to(r.code).emit('chat-received', msg);
    push(r, me, { title: '💬 ' + me, body: text.slice(0, 60), url: '/' });
  });

  sock.on('disconnect', () => {
    if (sock.data?.code) presence(sock.data.code);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`💎 NY v4 running on port ${PORT}`));