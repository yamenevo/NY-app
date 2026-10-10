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

const BACKUP_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  try { fs.mkdirSync(BACKUP_DIR); } catch(e) {}
}
setInterval(() => {
  if (!fs.existsSync(DB)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `data-${stamp}.json`);
  try { fs.copyFileSync(DB, backupPath); } catch(e) {}
}, 5 * 60 * 1000);

let rooms = {};
try {
  rooms = JSON.parse(fs.readFileSync(DB, 'utf8'));
  console.log('📂 Loaded', Object.keys(rooms).length, 'rooms');
} catch (e) {
  console.log('📂 Starting fresh');
}

let dirty = false;
const save = () => { dirty = true; };
setInterval(() => {
  if (!dirty) return;
  dirty = false;
  fs.writeFile(DB, JSON.stringify(rooms), (err) => {
    if (err) console.error('Save error:', err);
  });
}, 2000);

process.on('SIGTERM', () => { fs.writeFileSync(DB, JSON.stringify(rooms)); process.exit(0); });
process.on('SIGINT', () => { fs.writeFileSync(DB, JSON.stringify(rooms)); process.exit(0); });

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
const okAudio = s => typeof s === 'string' && s.startsWith('data:audio/') && s.length < 5e6;

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
  chat: r.chat || [],
  typing: r.typing || {},
  album: r.album || [],
  memories: r.memories || [],
  scheduled: r.scheduled || [],
  bottles: r.bottles || [],
  streak: r.streak || { count: 0, lastDate: null, todayUsers: [] },
  daily: r.daily || {},
    gifts: r.gifts || [],
  points: r.points || {},
  ideas: r.ideas || [],
  goals: r.goals || [],
  sharedDiary: r.sharedDiary || [],
  songOfWeek: r.songOfWeek || null,
  songsArchive: r.songsArchive || []
});


const TYPES = {
  activity: 'count', bold: 'count', challenge: 'count', love: 'count',
  gift: 'count', song: 'count', question: 'qCount', honesty: 'qCount', poem: 'pCount'
};

// دالة لزيادة النقاط
function addPoints(r, name, amount) {
  if (!r.points) r.points = {};
  r.points[name] = (r.points[name] || 0) + amount;
}

// دالة للتحقق من الرسائل المجدولة
function checkScheduledDeliveries() {
  const now = Date.now();
  for (const code in rooms) {
    const r = rooms[code];
    if (!r.scheduled || !r.scheduled.length) continue;
    const pending = r.scheduled.filter(m => !m.delivered && m.sendAt <= now);
    for (const m of pending) {
      m.delivered = true;
      io.to(code).emit('scheduled-delivered', m);
      push(r, null, { title: '💌 رسالة وصلت', body: m.title, url: '/' });
    }
    if (pending.length) save();
  }
}
setInterval(checkScheduledDeliveries, 30 * 1000); // كل 30 ثانية

// دالة لفتح الزجاجات العشوائية
function checkBottles() {
  const now = Date.now();
  for (const code in rooms) {
    const r = rooms[code];
    if (!r.bottles || !r.bottles.length) continue;
    const ready = r.bottles.filter(b => !b.opened && b.openAt <= now);
    for (const b of ready) {
      b.opened = true;
      io.to(code).emit('bottle-open', b);
    }
    if (ready.length) save();
  }
}
setInterval(checkBottles, 60 * 1000); // كل دقيقة

io.on('connection', sock => {
  const enter = (r, name) => {
    sock.data = { code: r.code, name };
    sock.join(r.code);
    presence(r.code);
  };

  const on = (ev, fn) => sock.on(ev, d => {
    const r = rooms[sock.data?.code];
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
      album: [],
      memories: [],
      scheduled: [],
      bottles: [],
      daily: {},
      gifts: [],
      points: { [name]: 0 },
      streak: { count: 0, lastDate: null, todayUsers: [] },
      profiles: { [name]: { ...DEFAULT_PROFILE, name } },
      customContent: { activities: [], questions: [], challenges: [], love: [], poems: [] },
      typing: {},
      createdAt: Date.now()
    };
    save();
    enter(r, name);
    cb({ room: view(r) });
    console.log(`✨ Room ${code} by ${name}`);
  });

  // ============ الانضمام ============
  sock.on('join', ({ code, name } = {}, cb) => {
    code = str(code, 9).toUpperCase();
    name = str(name, 20).trim();
    if (!name) return cb({ error: 'اكتب اسمك' });
    if (!code) return cb({ error: 'اكتب رمز الغرفة' });

    const r = rooms[code];
    if (!r) return cb({ error: 'الغرفة غير موجودة' });

    if (!r.profiles) r.profiles = {};
    if (!r.customContent) r.customContent = { activities: [], questions: [], challenges: [], love: [], poems: [] };
    if (!r.chat) r.chat = [];
    if (!r.diary) r.diary = [];
    if (!r.fights) r.fights = [];
    if (!r.subs) r.subs = [];
    if (!r.typing) r.typing = {};
    if (!r.album) r.album = [];
    if (!r.memories) r.memories = [];
    if (!r.scheduled) r.scheduled = [];
    if (!r.bottles) r.bottles = [];
    if (!r.daily) r.daily = {};
    if (!r.gifts) r.gifts = [];
    if (!r.points) r.points = {};
    if (!r.streak) r.streak = { count: 0, lastDate: null, todayUsers: [] };

    if (!r.users.includes(name)) {
      if (r.users.length >= 2) return cb({ error: 'الغرفة ممتلئة' });
      r.users.push(name);
      r.profiles[name] = { ...DEFAULT_PROFILE, name };
      r.points[name] = 0;
      save();
    }

    if (!r.profiles[name]) {
      r.profiles[name] = { ...DEFAULT_PROFILE, name };
      save();
    }

    enter(r, name);
    cb({ room: view(r) });
    sock.to(r.code).emit('toast', name + ' انضم');
  });

  // ============ سلسلة الأيام ============
  on('streak-checkin', (r, me, {}) => {
    if (!r.streak) r.streak = { count: 0, lastDate: null, todayUsers: [] };
    const today = new Date().toDateString();
    
    if (r.streak.lastDate === today) {
      if (!r.streak.todayUsers.includes(me)) {
        r.streak.todayUsers.push(me);
      }
    } else {
      // يوم جديد — احسب إذا كان متواصلاً
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      if (r.streak.lastDate === yesterday && r.streak.todayUsers.length >= 2) {
        r.streak.count++;
      } else if (r.streak.lastDate !== yesterday) {
        r.streak.count = 1;
      }
      r.streak.todayUsers = [me];
      r.streak.lastDate = today;
    }

    // إذا سجّل الطرفان اليوم — احسب العدد النهائي
    if (r.streak.todayUsers.length >= 2) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      if (r.streak.lastDate !== today) {
        r.streak.count++;
      }
    }

    addPoints(r, me, 5); // 5 نقاط لكل تسجيل
    save();
    io.to(r.code).emit('streak-updated', r.streak);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
  });

  // ============ التحدي اليومي ============
  on('daily-submit', (r, me, { date, question, answer }) => {
    date = str(date, 30);
    question = str(question, 200);
    answer = str(answer, 500);
    if (!date || !answer) return;
    
    if (!r.daily) r.daily = {};
    if (!r.daily[date]) r.daily[date] = { question, answers: {} };
    r.daily[date].answers[me] = answer;
    
    addPoints(r, me, 10); // 10 نقاط لكل إجابة
    save();
    io.to(r.code).emit('daily-updated', r.daily);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
  });

  // ============ الهدايا ============
  on('gift-send', (r, me, { emoji, name, price }) => {
    emoji = str(emoji, 8);
    name = str(name, 40);
    price = Number(price) || 0;
    
    if (!r.points) r.points = {};
    if (!r.gifts) r.gifts = [];
    
    const myPoints = r.points[me] || 0;
    if (myPoints < price) return;
    
    r.points[me] = myPoints - price;
    
    const gift = {
      id: id(),
      from: me,
      emoji,
      name,
      price,
      time: Date.now()
    };
    r.gifts.unshift(gift);
    r.gifts = r.gifts.slice(0, 100);
    
    save();
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
    push(r, me, { title: '🎁 هدية جديدة', body: me + ' أرسل لك ' + name, url: '/' });
  });

  // ============ الرسائل المجدولة ============
  on('scheduled-add', (r, me, { title, text, sendAt }) => {
    text = str(text, 1000);
    title = str(title, 60);
    if (!text || !sendAt) return;
    if (!r.scheduled) r.scheduled = [];
    const item = {
      id: id(),
      from: me,
      time: Date.now(),
      title: title || 'رسالة حب',
      text,
      sendAt: Number(sendAt),
      delivered: false
    };
    r.scheduled.push(item);
    r.scheduled = r.scheduled.slice(0, 50);
    save();
    io.to(r.code).emit('scheduled-entry', item);
  });

  // ============ زجاجات ============
  on('bottle-add', (r, me, { title, text }) => {
    text = str(text, 1000);
    title = str(title, 60);
    if (!text) return;
    if (!r.bottles) r.bottles = [];
    const openAt = Date.now() + (Math.random() * 7 * 24 * 60 * 60 * 1000);
    const item = {
      id: id(),
      from: me,
      time: Date.now(),
      title: title || 'رسالة',
      text,
      openAt,
      opened: false
    };
    r.bottles.push(item);
    save();
    io.to(r.code).emit('bottle-entry', item);
  });

  // ============ الرسائل الصوتية ============
  on('voice-send', (r, me, { audio, duration }) => {
    if (!okAudio(audio)) return;
    io.to(r.code).emit('voice-received', { audio, duration, from: me });
    push(r, me, { title: '🎤 رسالة صوتية', body: 'من ' + me + ' — ' + duration + 'ث', url: '/' });
    addPoints(r, me, 5);
    save();
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
  });

  // ============ الأحداث العامة ============
  on('action', (r, me, { type, payload }) => {
    if (!TYPES[type]) return;
    payload = str(payload, 800);
    if (!payload) return;
    r.stats[TYPES[type]]++;
    addPoints(r, me, 5);
    save();
    io.to(r.code).emit('stats', r.stats);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
    sock.to(r.code).emit('action', { type, payload, from: me });
    push(r, me, { title: 'NY — ' + me, body: payload.slice(0, 80), url: '/' });
  });

  // ============ اليوميات ============
  on('diary-add', (r, me, { entry: e = {} }) => {
    const x = {
      id: id(), from: me, time: Date.now(),
      title: str(e.title, 60) || 'بدون عنوان',
      text: str(e.text, 5000),
      mood: str(e.mood, 4),
      images: (Array.isArray(e.images) ? e.images : []).slice(0, 4).filter(okImg),
      reactions: {}, comments: []
    };
    r.diary.unshift(x);
    r.diary = r.diary.slice(0, 200);
    addPoints(r, me, 15);
    save();
    io.to(r.code).emit('diary-entry', x);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
    push(r, me, { title: '📔 يومية جديدة', body: me + ': ' + x.title, url: '/#/diary' });
  });

  on('diary-delete', (r, me, { id: i }) => {
    const n = r.diary.length;
    r.diary = r.diary.filter(e => !(e.id === i && e.from === me));
    if (r.diary.length !== n) { save(); io.to(r.code).emit('diary-removed', i); }
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
    push(r, me, { title: '💬 تعليق', body: me + ': ' + text.slice(0, 60), url: '/#/diary' });
  });

  // ============ العتاب ============
  on('fight-add', (r, me, { entry: e = {} }) => {
    const x = {
      id: id(), from: me, time: Date.now(),
      title: str(e.title, 60) || 'عتاب',
      text: str(e.text, 3000),
      anger: str(e.anger, 4),
      replies: [], resolved: false
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
    if (f.resolved) addPoints(r, me, 20);
    save();
    io.to(r.code).emit('fight-entry', f);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
    if (f.resolved) push(r, me, { title: '💞 تم الصلح', body: me + ' قبل الصلح', url: '/#/fights' });
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
    if (!r.customContent) r.customContent = { activities: [], questions: [], challenges: [], love: [], poems: [] };
    if (!r.customContent[type]) r.customContent[type] = [];
    const item = { id: id(), text, from: me, time: Date.now() };
    r.customContent[type].unshift(item);
    r.customContent[type] = r.customContent[type].slice(0, 100);
    addPoints(r, me, 10);
    save();
    io.to(r.code).emit('content-updated', r.customContent);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
  });

  on('content-delete', (r, me, { type, id: i }) => {
    if (!r.customContent || !r.customContent[type]) return;
    r.customContent[type] = r.customContent[type].filter(x => !(x.id === i && x.from === me));
    save();
    io.to(r.code).emit('content-updated', r.customContent);
  });

  // ============ ألبوم الصور ============
  on('album-add', (r, me, { image, caption, category }) => {
    if (!okImg(image)) return;
    if (!r.album) r.album = [];
    const item = {
      id: id(),
      from: me,
      time: Date.now(),
      image,
      caption: str(caption, 100),
      category: str(category, 20) || 'ذكريات'
    };
    r.album.unshift(item);
    r.album = r.album.slice(0, 100);
    addPoints(r, me, 20);
    save();
    io.to(r.code).emit('album-entry', item);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
    push(r, me, { title: '📸 صورة جديدة', body: me + ' أضاف صورة', url: '/' });
  });

  on('album-delete', (r, me, { id: i }) => {
    if (!r.album) return;
    const n = r.album.length;
    r.album = r.album.filter(p => !(p.id === i && p.from === me));
    if (r.album.length !== n) {
      save();
      io.to(r.code).emit('album-removed', i);
    }
  });

  // ============ تقويم الذكريات ============
  on('memory-add', (r, me, { title, date, note, emoji }) => {
    title = str(title, 60);
    if (!title || !date) return;
    if (!r.memories) r.memories = [];
    const item = {
      id: id(),
      from: me,
      time: Date.now(),
      title,
      date: Number(date),
      note: str(note, 300),
      emoji: str(emoji, 8) || '💎'
    };
    r.memories.push(item);
    r.memories = r.memories.slice(0, 100);
    addPoints(r, me, 15);
    save();
    io.to(r.code).emit('memory-entry', item);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
    push(r, me, { title: '📅 ذكرى جديدة', body: me + ': ' + title, url: '/' });
  });

  on('memory-delete', (r, me, { id: i }) => {
    if (!r.memories) return;
    const n = r.memories.length;
    r.memories = r.memories.filter(m => !(m.id === i && m.from === me));
    if (r.memories.length !== n) {
      save();
      io.to(r.code).emit('memory-removed', i);
    }
  });

  // ============ الدردشة الكاملة ============
  on('chat-send', (r, me, { text, image, audio, replyTo }) => {
    text = str(text, 2000);
    if (!text && !image && !audio) return;

    if (!r.chat) r.chat = [];
    const msg = {
      id: id(),
      from: me,
      text,
      image: okImg(image) ? image : null,
      audio: okAudio(audio) ? audio : null,
      replyTo: replyTo ? str(replyTo, 20) : null,
      time: Date.now(),
      read: false,
      readAt: null
    };
    r.chat.push(msg);
    r.chat = r.chat.slice(-200);

    if (r.typing[me]) delete r.typing[me];

    addPoints(r, me, 2);
    save();
    io.to(r.code).emit('chat-message', msg);
    io.to(r.code).emit('typing-update', r.typing);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });

    let body = text || (image ? '📷 صورة' : '🎤 رسالة صوتية');
    push(r, me, { title: '💬 ' + me, body: body.slice(0, 60), url: '/' });
  });

  on('chat-read', (r, me, { ids }) => {
    if (!r.chat || !Array.isArray(ids)) return;
    let changed = false;
    for (const i of ids) {
      const m = r.chat.find(x => x.id === i);
      if (m && m.from !== me && !m.read) {
        m.read = true;
        m.readAt = Date.now();
        changed = true;
      }
    }
    if (changed) {
      save();
      io.to(r.code).emit('chat-read-update', { ids, by: me, at: Date.now() });
    }
  });

  on('chat-delete', (r, me, { id: i }) => {
    const n = r.chat.length;
    r.chat = r.chat.filter(m => !(m.id === i && m.from === me));
    if (r.chat.length !== n) {
      save();
      io.to(r.code).emit('chat-deleted', i);
    }
  });

  on('chat-typing', (r, me, { isTyping }) => {
    if (!r.typing) r.typing = {};
    if (isTyping) {
      r.typing[me] = Date.now();
    } else {
      delete r.typing[me];
    }
    save();
    sock.to(r.code).emit('typing-update', r.typing);
  });
  // ============ مفكرة الأفكار ============
  on('idea-add', (r, me, { text, tag }) => {
    text = str(text, 500);
    if (!text) return;
    if (!r.ideas) r.ideas = [];
    const idea = {
      id: id(),
      from: me,
      text,
      tag: str(tag, 30) || 'فكرة',
      done: false,
      time: Date.now()
    };
    r.ideas.unshift(idea);
    addPoints(r, me, 5);
    save();
    io.to(r.code).emit('ideas-updated', r.ideas);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
  });

  on('idea-toggle', (r, me, { id: i }) => {
    const idea = r.ideas?.find(x => x.id === i);
    if (!idea) return;
    idea.done = !idea.done;
    if (idea.done) addPoints(r, me, 10);
    save();
    io.to(r.code).emit('ideas-updated', r.ideas);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
  });

  on('idea-remove', (r, me, { id: i }) => {
    if (!r.ideas) return;
    r.ideas = r.ideas.filter(x => !(x.id === i && x.from === me));
    save();
    io.to(r.code).emit('ideas-updated', r.ideas);
  });

  // ============ حصالة الأهداف ============
  on('goal-add', (r, me, { title, target, note }) => {
    title = str(title, 60);
    if (!title) return;
    if (!r.goals) r.goals = [];
    const goal = {
      id: id(),
      from: me,
      title,
      target: Number(target) || 100,
      current: 0,
      note: str(note, 200),
      time: Date.now()
    };
    r.goals.push(goal);
    save();
    io.to(r.code).emit('goals-updated', r.goals);
    push(r, me, { title: '💰 هدف جديد', body: me + ': ' + title, url: '/' });
  });

  on('goal-contribute', (r, me, { id: i, amount }) => {
    const goal = r.goals?.find(x => x.id === i);
    if (!goal) return;
    goal.current = Math.min(goal.target, goal.current + (Number(amount) || 0));
    save();
    io.to(r.code).emit('goals-updated', r.goals);
    if (goal.current >= goal.target) {
      push(r, me, { title: '🎉 هدف مكتمل', body: goal.title + ' — مبروك!', url: '/' });
    }
  });

  // ============ اليوميات المشتركة ============
  on('shared-diary-add', (r, me, { text }) => {
    text = str(text, 1000);
    if (!text) return;
    if (!r.sharedDiary) r.sharedDiary = [];
    const entry = {
      id: id(),
      from: me,
      text,
      time: Date.now()
    };
    r.sharedDiary.unshift(entry);
    r.sharedDiary = r.sharedDiary.slice(0, 500);
    addPoints(r, me, 10);
    save();
    io.to(r.code).emit('shared-diary-updated', r.sharedDiary);
    io.to(r.code).emit('gifts-updated', { gifts: r.gifts, points: r.points });
  });

  // ============ أغنية الأسبوع ============
  on('song-week-add', (r, me, { title, artist, link }) => {
    title = str(title, 100);
    if (!title) return;
    const song = {
      id: id(),
      title,
      artist: str(artist, 60),
      link: str(link, 300),
      from: me,
      time: Date.now()
    };
    
    if (r.songOfWeek) {
      if (!r.songsArchive) r.songsArchive = [];
      r.songsArchive.unshift(r.songOfWeek);
      r.songsArchive = r.songsArchive.slice(0, 50);
    }
    r.songOfWeek = song;
    
    save();
    io.to(r.code).emit('song-week-updated', {
      current: r.songOfWeek,
      archive: r.songsArchive || []
    });
    push(r, me, { title: '🎵 أغنية الأسبوع', body: me + ': ' + title, url: '/' });
  });

  // ============ انفصال ============
  sock.on('disconnect', () => {
    if (sock.data?.code) {
      const r = rooms[sock.data.code];
      if (r && r.typing && sock.data.name) {
        delete r.typing[sock.data.name];
        save();
        sock.to(r.code).emit('typing-update', r.typing);
      }
      presence(sock.data.code);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`💎 NY v12 running on port ${PORT}`));