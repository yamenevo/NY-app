// ============ NY Core v3.0 ============
window.NY = window.NY || {};

NY.S = {
  code: localStorage.code,
  name: localStorage.name,
  room: null,
  online: [],
  cur: null,
  mood: '😊',
  anger: '🙂',
  imgs: [],
  open: false,
  connecting: false,
  currentTab: 'home',
  currentSettingsTab: 'profile',
  currentContentTab: 'activities'
};

NY.EM = ['❤️', '😍', '🔥', '💋', '👏'];
NY.MOODS = ['😊', '🥰', '😢', '😍', '😔', '😴'];
NY.ANG = ['🙂', '😐', '😠', '😡', '💔'];

NY.K = {
  activity: ['🎲', 'فعالية', 'activities'],
  bold: ['🔥', 'جريء', 'boldActivities'],
  question: ['❓', 'سؤال', 'questions'],
  challenge: ['⚡', 'تحدي', 'challenges'],
  love: ['💌', 'رسالة حب', 'loveMessages'],
  honesty: ['💬', 'صراحة', 'honestyQuestions'],
  poem: ['📜', 'إهداء شعري', 'poems'],
  gift: ['🎁', 'هدية', 'gifts'],
  song: ['🎵', 'أغنية', 'songs']
};

// ============ Helpers ============
NY.$ = s => document.querySelector(s);
NY.$$ = s => document.querySelectorAll(s);
NY.app = () => document.getElementById('app');

NY.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

NY.pick = a => a[Math.floor(Math.random() * a.length)];

NY.when = t => new Date(t).toLocaleString('ar', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
});

NY.up = (l, e) => {
  const i = l.findIndex(x => x.id === e.id);
  i < 0 ? l.unshift(e) : l[i] = e;
};

NY.toast = function(t) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = t;
  document.body.append(d);
  setTimeout(() => d.remove(), 3000);
};

NY.playNotificationSound = function() {
  if (window.NYSettings?.data?.sounds === false) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
};

// ============ Socket ============
NY.socket = io();
window.socket = NY.socket;

// ============ Account Management ============
NY.logout = function() {
  if (!confirm('هل تريد تسجيل الخروج؟\n\nستحتاج إدخال اسمك والغرفة مرة أخرى.')) return;
  const savedName = NY.S.name;
  localStorage.clear();
  if (savedName) localStorage.setItem('ny-saved-name', savedName);
  NY.S.code = null;
  NY.S.name = null;
  NY.S.room = null;
  location.reload();
};

NY.changeRoom = function() {
  if (!confirm('تغيير الغرفة؟\n\nستخرج من الغرفة الحالية ويمكنك الدخول لغرفة أخرى.')) return;
  const savedName = NY.S.name;
  localStorage.removeItem('code');
  localStorage.setItem('ny-saved-name', savedName);
  NY.S.code = null;
  NY.S.room = null;
  location.reload();
};

NY.resetAll = function() {
  if (!confirm('⚠️ سيتم حذف كل البيانات. متأكد؟')) return;
  if (!confirm('تأكيد أخير: سيتم حذف كل شيء!')) return;
  localStorage.clear();
  location.reload();
};

NY.forceLogout = function() {
  NY.S.code = null;
  NY.S.room = null;
  NY.S.connecting = false;
  if (NY.S.name) localStorage.setItem('ny-saved-name', NY.S.name);
  localStorage.removeItem('code');
  NY.S.currentTab = 'home';
  NY.route();
};

window.logout = NY.logout;
window.changeRoom = NY.changeRoom;
window.resetAll = NY.resetAll;
window.forceLogout = NY.forceLogout;

// ============ Auth ============
NY.auth = function(r) {
  NY.S.connecting = false;

  if (r.error) {
    NY.S.room = null;
    if (NY.S.name) localStorage.setItem('ny-saved-name', NY.S.name);

    if (r.error.includes('الغرفة') || r.error.includes('موجودة') || r.error.includes('ممتلئة')) {
      localStorage.removeItem('code');
      NY.S.code = null;
    }

    NY.toast('❌ ' + r.error);
    console.warn('Join error:', r.error);

    NY.S.currentTab = 'home';
    NY.route();
    return;
  }

  NY.S.room = r.room;
  NY.S.code = r.room.code;
  localStorage.code = NY.S.code;
  localStorage.name = NY.S.name;
  localStorage.setItem('ny-saved-name', NY.S.name);

  if (r.room.profiles && window.NYProfile) {
    const myProfile = r.room.profiles[NY.S.name];
    if (myProfile) Object.assign(window.NYProfile.data, myProfile);
    else window.NYProfile.save();
  }

  if (r.room.customContent && window.NYContent) {
    window.NYContent.updateFromServer(r.room.customContent);
  }

  console.log('✅ Joined room:', NY.S.code);
  NY.route();
};

// ============ Socket Events ============
NY.socket.on('connect', () => {
  if (NY.S.code && NY.S.name) {
    NY.S.connecting = true;
    NY.route();
    NY.socket.emit('join', { code: NY.S.code, name: NY.S.name }, NY.auth);

    setTimeout(() => {
      if (NY.S.connecting) {
        NY.S.connecting = false;
        NY.toast('⚠️ تعذر الاتصال. حاول مرة أخرى.');
        NY.forceLogout();
      }
    }, 5000);
  } else {
    NY.route();
  }
});

NY.socket.on('disconnect', () => NY.toast('⚠️ انقطع الاتصال'));

NY.socket.on('reconnect', () => {
  NY.toast('✅ عاد الاتصال');
  if (NY.S.code && NY.S.name && !NY.S.room) {
    NY.socket.emit('join', { code: NY.S.code, name: NY.S.name }, NY.auth);
  }
});

NY.socket.on('presence', o => {
  NY.S.online = o;
  if (NY.S.room && NY.S.currentTab === 'home') NY.renderTab('home');
});

NY.socket.on('toast', NY.toast);

NY.socket.on('stats', s => {
  if (NY.S.room) NY.S.room.stats = s;
  if (NY.S.room && NY.S.currentTab === 'home') NY.renderTab('home');
});

NY.socket.on('action', ({ type, payload, from }) => {
  NY.playNotificationSound();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  const o = document.createElement('div');
  o.className = 'ov';
  o.innerHTML = `<div class="card modal-anim">
    <div style="font-size:2em;margin-bottom:8px">${NY.esc(NY.K[type]?.[0] || '💎')}</div>
    <small style="color:var(--rgl);font-weight:700">${NY.esc(from)}</small>
    <br><br>
    <div style="line-height:1.7">${NY.esc(payload)}</div>
    <br>
    <button class="btn2" style="width:auto;padding:8px 16px;margin-top:12px" 
            onclick="this.closest('.ov').remove()">✕ إغلاق</button>
  </div>`;
  document.body.append(o);
});

NY.socket.on('profiles-updated', profiles => {
  if (NY.S.room) NY.S.room.profiles = profiles;
  if (NY.S.currentTab === 'home') NY.renderTab('home');
});

// ============ Router ============
NY.route = function() {
  const app = NY.app();
  if (!app) return;

  if (!NY.S.room) {
    if (NY.S.connecting) {
      app.innerHTML = `
        <div class="empty">
          <div class="empty-icon">💎</div>
          <p>جاري الاتصال...</p>
          <button class="btn2" style="width:auto;padding:10px 20px;margin-top:20px" 
                  onclick="forceLogout()">❌ إلغاء والعودة</button>
        </div>`;
    } else {
      NY.renderLogin();
    }
    return;
  }

  NY.renderTab(NY.S.currentTab);
};

NY.go = function(tab, subpath) {
  if (tab === 'content' && subpath) {
    NY.openSubPage(subpath);
    return;
  }
  NY.S.currentTab = tab;
  if (NY.S.room) NY.renderTab(tab);
};

// ============ Tab Renderer ============
NY.renderTab = function(tab) {
  const app = NY.app();
  if (!app) return;

  const header = NY.renderHeader();
  const navbar = window.NYNav ? window.NYNav.render() : '';
  let content = '';

  if (tab === 'home') {
    content = NY.renderHomeContent();
  } else if (tab === 'chat') {
    const chatTab = window.NYSubTabs?.current?.chat || 'messages';
    const subTabs = `
      <div class="sub-tabs">
        <button class="${chatTab === 'messages' ? 'active' : ''}" onclick="NYSubTabs.set('chat', 'messages')">💬 الرسائل</button>
        <button class="${chatTab === 'ai' ? 'active' : ''}" onclick="NYSubTabs.set('chat', 'ai')">🤖 المساعد</button>
      </div>
    `;
    if (chatTab === 'ai') {
      content = subTabs + (window.NYAI ? window.NYAI.render() : '');
    } else {
      content = subTabs + (window.NYChat ? window.NYChat.render() : '');
    }
  } else if (tab === 'add') {
    content = NY.renderAddContent();
  } else if (tab === 'memories') {
    content = NY.renderMemoriesContent();
  } else if (tab === 'games') {
    content = NY.renderGamesContent();
  } else if (tab === 'me') {
    content = NY.renderMeContent();
  }

  app.innerHTML = `
    <div class="app-shell">
      ${header}
      <div class="app-content">${content}</div>
      ${navbar}
    </div>
  `;

  if (window.NYNav) window.NYNav.attachEvents();
  if (tab === 'chat' && window.NYChat) window.NYChat.attachEvents();
  if (window.NYMusic?.apiLoaded) window.NYMusic.updateUI();
};

// ============ Header ============
NY.renderHeader = function() {
  const profile = window.NYProfile?.data || {};
  const tabTitles = {
    home: { title: 'NY', sub: 'مساحتنا الخاصة' },
    chat: { title: '💬 الدردشة', sub: 'تحدثا معاً' },
    add: { title: '➕ إضافة', sub: 'محتوى جديد' },
    memories: { title: '❤️ ذكرياتنا', sub: 'لحظاتنا الجميلة' },
    games: { title: '🎮 ألعاب', sub: 'العبا معاً' },
    me: { title: '👤 أنا', sub: profile.status || 'أحبك' }
  };
  const t = tabTitles[NY.S.currentTab] || tabTitles.home;

  return `
    <header class="app-header">
      <div>
        <div class="header-title">${t.title}</div>
        <div class="header-subtitle">${NY.esc(t.sub)}</div>
      </div>
      <div class="header-actions">
        <button class="header-btn" onclick="NY.toggleTheme()" title="الوضع">🌙</button>
        <button class="header-btn" onclick="NY.go('me')" title="الملف الشخصي">👤</button>
      </div>
    </header>
  `;
};

NY.toggleTheme = function() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
};

if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light-mode');
}

// ============ Login ============
NY.renderLogin = function() {
  const app = NY.app();
  if (!app) return;
  const savedName = localStorage.getItem('ny-saved-name') || NY.S.name || '';

  app.innerHTML = `
    <div class="login fade-in">
      <img src="/logo.png" class="app-logo float" 
           onerror="this.style.display='none'">
      <h1 class="shimmer-logo">NY</h1>
      <p class="login-tagline">مساحتنا الخاصة</p>
      
      <input id="n" placeholder="اسمك" maxlength="20" 
             value="${NY.esc(savedName)}">
      <input id="c" placeholder="رمز الغرفة NY-XXXX (للانضمام)" 
             maxlength="9" style="text-transform:uppercase">
      
      <button class="btn" onclick="NY.createRoom()">✨ إنشاء غرفة جديدة</button>
      <button class="btn2" onclick="NY.joinRoom()">🔗 الانضمام لغرفة</button>
    </div>
  `;
};

NY.createRoom = function() {
  const name = document.getElementById('n').value.trim();
  if (!name) return NY.toast('اكتب اسمك');
  NY.S.name = name;
  localStorage.setItem('ny-saved-name', name);
  if (window.NYSettings) window.NYSettings.set('name', name);
  if (window.NYProfile) window.NYProfile.set('name', name);
  NY.S.connecting = true;
  NY.route();
  NY.socket.emit('create', { name }, NY.auth);
};

NY.joinRoom = function() {
  const name = document.getElementById('n').value.trim();
  const code = document.getElementById('c').value.trim().toUpperCase();
  if (!name || !code) return NY.toast('اكتب الاسم والرمز');
  NY.S.name = name;
  NY.S.code = code;
  localStorage.setItem('ny-saved-name', name);
  if (window.NYSettings) window.NYSettings.set('name', name);
  if (window.NYProfile) window.NYProfile.set('name', name);
  NY.S.connecting = true;
  NY.route();
  NY.socket.emit('join', { code, name }, NY.auth);
};

// ============ Home ============
NY.renderHomeContent = function() {
  const s = NY.S.room.stats || {};
  const profile = window.NYProfile?.data || {};
  const avatarHTML = profile.avatarImage
    ? `<img src="${profile.avatarImage}">`
    : (profile.avatar || '💎');

  return `
    <div class="status-bar">
      <span>💎 <b>${NY.esc(NY.S.code)}</b></span>
      <span>${NY.S.online.length > 1 ? '🟢 متصل' : '⚪ غير متصل'}</span>
    </div>

    <div class="welcome-card">
      <div class="welcome-avatar">${avatarHTML}</div>
      <div class="welcome-info">
        <div class="welcome-name">${NY.esc(NY.S.name)}</div>
        <div class="welcome-status">${NY.esc(profile.status || 'أحبك')}</div>
      </div>
    </div>

    <div class="stats">
      <div><b>${s.count || 0}</b>فعاليات</div>
      <div><b>${s.qCount || 0}</b>أسئلة</div>
      <div><b>${s.pCount || 0}</b>أشعار</div>
    </div>

    <div class="grid">
      <button onclick="NY.go('content', 'love')">💌<span>رسالة حب</span></button>
      <button onclick="NY.go('content', 'activity')">🎲<span>فعالية</span></button>
      <button onclick="NY.go('content', 'question')">❓<span>سؤال</span></button>
      <button onclick="NY.go('content', 'challenge')">⚡<span>تحدي</span></button>
      <button onclick="NY.go('content', 'honesty')">💬<span>صراحة</span></button>
      <button onclick="NY.go('content', 'poem')">📜<span>إهداء</span></button>
      <button onclick="NY.go('content', 'gift')">🎁<span>هدية</span></button>
      <button onclick="NY.go('content', 'song')">🎵<span>أغنية</span></button>
      <button onclick="NY.go('content', 'bold')">🔥<span>جريء</span></button>
    </div>

    <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button class="btn2" onclick="NY.openSubPage('daily')">🎯<br>تحدي اليوم</button>
      <button class="btn2" onclick="NY.openSubPage('streak')">🔥<br>سلسلة الأيام</button>
      <button class="btn2" onclick="NY.openSubPage('clock')">🌙<br>ساعة الحبيب</button>
      <button class="btn2" onclick="NY.openSubPage('ideas')">💭<br>مفكرة أفكار</button>
    </div>

    <div style="margin-top:12px">
      <button class="btn2" onclick="NY.go('add')">✨ إضافة محتوى خاص</button>
    </div>
  `;
};

// ============ Add ============
NY.renderAddContent = function() {
  return `
    <div class="grid">
      <button onclick="NY.openSubPage('diary')">📔<span>يومية</span></button>
      <button onclick="NY.openSubPage('fights')">💢<span>عتاب</span></button>
      <button onclick="NY.openSubPage('content')">✨<span>محتوى</span></button>
      <button onclick="NYAlbum?.pickPhoto()">📸<span>صورة</span></button>
      <button onclick="NYMemories?.addMemory()">📅<span>ذكرى</span></button>
      <button onclick="NY.openSubPage('music')">🎵<span>أغنية</span></button>
    </div>
  `;
};

// ============ Memories ============
NY.renderMemoriesContent = function() {
  const subTab = window.NYSubTabs?.current?.memories || 'photos';
  const subTabs = `
    <div class="sub-tabs">
      <button class="${subTab === 'photos' ? 'active' : ''}" 
              onclick="NYSubTabs.set('memories', 'photos')">📸 الألبوم</button>
      <button class="${subTab === 'dates' ? 'active' : ''}" 
              onclick="NYSubTabs.set('memories', 'dates')">📅 الذكريات</button>
      <button class="${subTab === 'messages' ? 'active' : ''}" 
              onclick="NYSubTabs.set('memories', 'messages')">💌 رسائل</button>
      <button class="${subTab === 'bottles' ? 'active' : ''}" 
              onclick="NYSubTabs.set('memories', 'bottles')">🍾 زجاجات</button>
      <button class="${subTab === 'surprises' ? 'active' : ''}" 
              onclick="NYSubTabs.set('memories', 'surprises')">🎁 مفاجآت</button>
    </div>
  `;
  
  if (subTab === 'dates') return subTabs + (window.NYMemories ? window.NYMemories.render() : '');
  if (subTab === 'messages' || subTab === 'bottles') return subTabs + (window.NYMessages ? window.NYMessages.render() : '');
  if (subTab === 'surprises') return subTabs + (window.NYSurprises ? window.NYSurprises.render() : '');
  return subTabs + (window.NYAlbum ? window.NYAlbum.render() : '');
};

// ============ Games ============
NY.renderGamesContent = function() {
  const subTab = window.NYSubTabs?.current?.games || 'games';
  const subTabs = `
    <div class="sub-tabs">
      <button class="${subTab === 'games' ? 'active' : ''}" 
              onclick="NYSubTabs.set('games', 'games')">🎮 الألعاب</button>
      <button class="${subTab === 'gifts' ? 'active' : ''}" 
              onclick="NYSubTabs.set('games', 'gifts')">🎁 الهدايا</button>
    </div>
  `;
  if (subTab === 'gifts') {
    return subTabs + (window.NYGifts ? window.NYGifts.render() : '');
  }
  return subTabs + (window.NYGames ? window.NYGames.render() : '');
};

// ============ Me ============
NY.renderMeContent = function() {
  const profile = window.NYProfile?.data || {};
  const room = NY.S.room || {};
  const points = room.points?.[NY.S.name] || 0;
  
  const avatarHTML = profile.avatarImage
    ? `<img src="${profile.avatarImage}">`
    : (profile.avatar || '💎');

  const since = room.createdAt ? Math.floor((Date.now() - room.createdAt) / 86400000) : 0;
  const messages = (room.chat || []).filter(m => m.from === NY.S.name).length;
  const photos = (room.album || []).filter(p => p.from === NY.S.name).length;
  const memories = (room.memories || []).length;

  return `
    <div class="card2" style="text-align:center;padding:24px;margin-bottom:16px">
      <div class="welcome-avatar" style="width:90px;height:90px;font-size:2.6em;margin:0 auto 12px">
        ${avatarHTML}
      </div>
      <div style="color:var(--rg);font-family:'Reem Kufi',serif;font-size:1.4em;font-weight:700">
        ${NY.esc(NY.S.name)}
      </div>
      <div style="color:var(--mut);font-size:0.85em;margin-top:4px">
        ${NY.esc(profile.status || 'أحبك')}
      </div>
      <div style="color:var(--rg);font-weight:700;font-size:1.2em;margin-top:12px">
        💎 ${points} نقطة
      </div>
    </div>

    <h3 style="color:var(--rg);font-size:0.95em;margin-bottom:12px">📊 إحصائيات</h3>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px">
      <div class="card2" style="text-align:center;padding:14px">
        <div style="color:var(--rg);font-size:1.5em;font-weight:700">${since}</div>
        <div style="color:var(--mut);font-size:0.75em">يوم معاً</div>
      </div>
      <div class="card2" style="text-align:center;padding:14px">
        <div style="color:var(--rg);font-size:1.5em;font-weight:700">${messages}</div>
        <div style="color:var(--mut);font-size:0.75em">رسالة</div>
      </div>
      <div class="card2" style="text-align:center;padding:14px">
        <div style="color:var(--rg);font-size:1.5em;font-weight:700">${photos}</div>
        <div style="color:var(--mut);font-size:0.75em">صورة</div>
      </div>
      <div class="card2" style="text-align:center;padding:14px">
        <div style="color:var(--rg);font-size:1.5em;font-weight:700">${memories}</div>
        <div style="color:var(--mut);font-size:0.75em">ذكرى</div>
      </div>
    </div>

    <h3 style="color:var(--rg);font-size:0.95em;margin-bottom:12px">⚙️ الأدوات</h3>
    <button class="btn2" onclick="NY.openSubPage('clock')">🌙 ساعة الحبيب</button>
    <button class="btn2" onclick="NY.openSubPage('ideas')">💭 مفكرة الأفكار</button>
    <button class="btn2" onclick="NY.openSubPage('goals')">💰 حصالة الأهداف</button>
    <button class="btn2" onclick="NY.openSubPage('shared-diary')">📖 يومياتنا المشتركة</button>
    <button class="btn2" onclick="NY.openSubPage('song-week')">🎵 أغنية الأسبوع</button>
    <button class="btn2" onclick="NY.openSubPage('themes')">🎨 الثيمات الموسمية</button>
    <button class="btn2" onclick="NY.openSubPage('backgrounds')">✨ الخلفيات</button>

    <h3 style="color:var(--rg);font-size:0.95em;margin:20px 0 12px">📚 أخرى</h3>
    <button class="btn2" onclick="NY.openSubPage('diary')">📔 يومياتي</button>
    <button class="btn2" onclick="NY.openSubPage('fights')">💢 عاتبني</button>
    <button class="btn2" onclick="NY.openSubPage('music')">🎵 الموسيقى</button>
    <button class="btn2" onclick="NY.openSubPage('about')">📖 قصة NY</button>
    <button class="btn2" onclick="NY.openSubPage('settings')">⚙️ الإعدادات</button>
    <button class="btn2" onclick="logout()" style="background:rgba(217,83,79,0.2);color:#ff8a80;border-color:rgba(217,83,79,0.4)">
      🚪 تسجيل الخروج
    </button>
  `;
};

// ============ Sub-pages ============
NY.openSubPage = function(name) {
  const pages = {
    diary: () => { location.hash = '#/diary'; NY.route(); },
    fights: () => { location.hash = '#/fights'; NY.route(); },
    music: () => { location.hash = '#/music'; NY.route(); },
    settings: () => { location.hash = '#/settings'; NY.route(); },
    about: () => { location.hash = '#/about'; NY.route(); },
    content: () => { location.hash = '#/content'; NY.route(); },
    love: () => { NY.showContent('love'); },
    activity: () => { NY.showContent('activity'); },
    question: () => { NY.showContent('question'); },
    challenge: () => { NY.showContent('challenge'); },
    honesty: () => { NY.showContent('honesty'); },
    poem: () => { NY.showContent('poem'); },
    gift: () => { NY.showContent('gift'); },
    song: () => { NY.showContent('song'); },
    bold: () => { NY.showContent('bold'); },
    daily: () => { NY.showFullScreen('🎯 تحدي اليوم', window.NYDaily?.render()); },
    streak: () => { NY.showFullScreen('🔥 سلسلة الأيام', window.NYStreak?.render()); },
    clock: () => { 
      NY.showFullScreen('🌙 ساعة الحبيب', window.NYClock?.render()); 
      setTimeout(() => window.NYClock?.attachEvents(), 100);
    },
    ideas: () => { NY.showFullScreen('💭 مفكرة الأفكار', window.NYIdeas?.render()); },
    goals: () => { NY.showFullScreen('💰 حصالة الأهداف', window.NYGoals?.render()); },
    'shared-diary': () => { NY.showFullScreen('📖 يومياتنا', window.NYSharedDiary?.render()); },
    'song-week': () => { NY.showFullScreen('🎵 أغنية الأسبوع', window.NYSongWeek?.render()); },
    themes: () => { NY.showFullScreen('🎨 الثيمات الموسمية', window.NYSeasonalThemes?.render()); },
    backgrounds: () => { NY.showFullScreen('✨ الخلفيات', window.NYBackgrounds?.render()); },
    gifts: () => { NY.showFullScreen('🎁 متجر الهدايا', window.NYGifts?.render()); }
  };
  (pages[name] || (() => NY.toast('قريباً')))();
};

// ============ Show Content ============
NY.showContent = function(k) {
  const K = NY.K[k];
  if (!K) return NY.toast('قريباً');
  
  const overlay = document.createElement('div');
  overlay.className = 'ov';
  overlay.style.background = 'rgba(0,0,0,0.9)';
  overlay.innerHTML = `
    <div class="card2" style="max-width:500px;width:100%;padding:20px">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:2.5em">${K[0]}</div>
        <div style="color:var(--rg);font-family:'Reem Kufi',serif;font-size:1.3em;font-weight:700;margin-top:8px">
          ${K[1]}
        </div>
      </div>
      
      <div class="card" id="contentCard" style="min-height:100px;padding:20px;text-align:center;margin-bottom:12px">
        اضغط «جديد» لعرض ${K[1]}
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn" onclick="NY.genContent('${k}')">✨ جديد</button>
        <button class="btn2" onclick="NY.sendContent('${k}')">💌 إرسال</button>
      </div>
      
      <button class="btn2" style="margin-top:12px" onclick="this.closest('.ov').remove()">✕ إغلاق</button>
    </div>
  `;
  document.body.append(overlay);
};

NY._curContent = null;

NY.genContent = function(k) {
  const K = NY.K[k];
  let item;
  
  const typeMap = {
    activity: 'activities', bold: 'activities', challenge: 'challenges',
    question: 'questions', love: 'love', poem: 'poems'
  };
  const type = typeMap[k];
  
  if (type && window.NYContent?.custom?.[type]?.length) {
    const custom = window.NYContent.custom[type];
    if (Math.random() < 0.5) {
      item = custom[Math.floor(Math.random() * custom.length)].text;
    }
  }
  
  if (!item && window.LoveData) {
    const list = LoveData[K[2]];
    if (list && list.length) {
      item = list[Math.floor(Math.random() * list.length)];
    }
  }
  
  if (!item) return NY.toast('لا يوجد محتوى');
  
  let text;
  if (k === 'poem' && item.author) {
    text = `📜 ${item.author}:\n«${item.text}»`;
  } else if (k === 'gift' && item.emoji) {
    text = `🎁 ${item.emoji} ${item.name}`;
  } else if (k === 'song') {
    text = `🎵 ${item}`;
  } else if (k === 'love') {
    text = `💌 ${item}`;
  } else {
    text = String(item);
  }
  
  NY._curContent = { type: k, text };
  
  const card = document.getElementById('contentCard');
  if (card) {
    card.textContent = text;
    card.classList.add('bounce-in');
    setTimeout(() => card.classList.remove('bounce-in'), 700);
  }
};

NY.sendContent = function(k) {
  if (!NY._curContent || NY._curContent.type !== k) {
    return NY.toast('اضغط «جديد» أولاً');
  }
  NY.socket.emit('action', { type: k, payload: NY._curContent.text });
  NY.toast('💌 تم الإرسال');
};

// ============ Full Screen ============
NY.showFullScreen = function(title, contentHTML) {
  const existing = document.getElementById('fullScreenPage');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'fullScreenPage';
  overlay.className = 'full-screen';
  overlay.innerHTML = `
    <div class="hd">
      <button onclick="document.getElementById('fullScreenPage').remove()">→</button>
      <b>${title}</b>
      <span style="width:36px"></span>
    </div>
    <div style="flex:1;overflow-y:auto;padding:12px">${contentHTML}</div>
  `;
  document.body.append(overlay);
};

// ============ Diagnostics ============
NY.diagnostics = function() {
  const info = {
    'localStorage.code': localStorage.code,
    'localStorage.name': localStorage.name,
    'NY.S.code': NY.S.code,
    'NY.S.name': NY.S.name,
    'NY.S.room': NY.S.room ? NY.S.room.code : null,
    'socket.connected': NY.socket.connected,
    'socket.id': NY.socket.id
  };
  console.table(info);
};
window.diag = NY.diagnostics;

console.log('✅ NY Core v3.0 loaded');