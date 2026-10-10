// ============ NY App v9.0 — Fixed & Improved ============
const $ = s => document.querySelector(s);
const app = $('#app');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const K = {
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

const EM = ['❤️', '😍', '🔥', '💋', '👏'];
const MOODS = ['😊', '🥰', '😢', '😍', '😔', '😴'];
const ANG = ['🙂', '😐', '😠', '😡', '💔'];

const S = {
  code: localStorage.code,
  name: localStorage.name,
  room: null,
  online: [],
  cur: null,
  mood: MOODS[0],
  anger: ANG[0],
  imgs: [],
  open: false,
  currentSettingsTab: 'profile',
  currentContentTab: 'activities',
  connecting: false
};

if (window.NYSettings) {
  window.NYSettings.load();
  window.NYSettings.apply();
}

const socket = io();
window.socket = socket;

const pick = a => a[Math.floor(Math.random() * a.length)];
const when = t => new Date(t).toLocaleString('ar', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
});
const page = () => location.hash.replace(/^#\/?/, '');
const up = (l, e) => {
  const i = l.findIndex(x => x.id === e.id);
  i < 0 ? l.unshift(e) : l[i] = e;
};

function toast(t) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = t;
  document.body.append(d);
  setTimeout(() => d.remove(), 3000);
}
window.toast = toast;

// ============ Logout & Reset ============
function logout() {
  if (!confirm('هل تريد تسجيل الخروج؟\n\nستحتاج إدخال اسمك والغرفة مرة أخرى.')) return;
  
  // احتفظ بالاسم فقط
  const savedName = S.name;
  localStorage.clear();
  if (savedName) localStorage.setItem('ny-saved-name', savedName);
  
  S.code = null;
  S.name = null;
  S.room = null;
  
  location.hash = '#/';
  location.reload();
}
window.logout = logout;

function changeRoom() {
  if (!confirm('تغيير الغرفة؟\n\nستخرج من الغرفة الحالية ويمكنك الدخول لغرفة أخرى.')) return;
  
  // احتفظ بالاسم
  const savedName = S.name;
  localStorage.removeItem('code');
  localStorage.setItem('ny-saved-name', savedName);
  
  S.code = null;
  S.room = null;
  
  location.hash = '#/';
  location.reload();
}
window.changeRoom = changeRoom;

function resetAll() {
  if (!confirm('⚠️ تحذير!\n\nسيتم حذف كل البيانات المحلية: الإعدادات، الأغاني، الترتيب، الملف الشخصي.\n\nهل أنت متأكد؟')) return;
  if (!confirm('تأكيد أخير: سيتم حذف كل شيء!')) return;
  
  localStorage.clear();
  location.hash = '#/';
  location.reload();
}
window.resetAll = resetAll;

// ============ Force Logout on Error ============
function forceLogout(reason) {
  S.code = null;
  S.room = null;
  localStorage.removeItem('code');
  
  if (reason) {
    const savedName = S.name;
    if (savedName) localStorage.setItem('ny-saved-name', savedName);
  }
  
  location.hash = '#/';
  route();
}

// ============ Socket Handlers ============
function auth(r) {
  S.connecting = false;
  
  if (r.error) {
    S.room = null;
    
    // حفظ الاسم قبل الحذف
    if (S.name) localStorage.setItem('ny-saved-name', S.name);
    
    // حذف الغرفة إذا كانت المشكلة فيها
    if (r.error.includes('الغرفة') || r.error.includes('موجودة')) {
      localStorage.removeItem('code');
      S.code = null;
    }
    
    toast('❌ ' + r.error);
    
    // العودة لشاشة الدخول
    setTimeout(() => {
      location.hash = '#/';
      route();
    }, 500);
    
    return;
  }
  
  S.room = r.room;
  S.code = r.room.code;
  localStorage.code = S.code;
  localStorage.name = S.name;
  localStorage.setItem('ny-saved-name', S.name);

  if (r.room.profiles && window.NYProfile) {
    const myProfile = r.room.profiles[S.name];
    if (myProfile) Object.assign(window.NYProfile.data, myProfile);
    else window.NYProfile.save();
  }

  if (r.room.customContent && window.NYContent) {
    window.NYContent.updateFromServer(r.room.customContent);
  }

  route();
}

socket.on('connect', () => {
  if (S.code && S.name) {
    S.connecting = true;
    route(); // اعرض شاشة الاتصال
    
    socket.emit('join', { code: S.code, name: S.name }, r => {
      auth(r);
    });
    
    // Timeout: إذا لم يستجب السيرفر في 5 ثوان
    setTimeout(() => {
      if (S.connecting) {
        S.connecting = false;
        toast('⚠️ تعذر الاتصال. حاول مرة أخرى.');
        forceLogout(true);
      }
    }, 5000);
  } else {
    route();
  }
});

socket.on('disconnect', () => {
  toast('⚠️ انقطع الاتصال');
});

socket.on('reconnect', () => {
  toast('✅ عاد الاتصال');
  if (S.code && S.name && !S.room) {
    socket.emit('join', { code: S.code, name: S.name }, auth);
  }
});

socket.on('presence', o => {
  S.online = o;
  if (!page()) route();
});

socket.on('toast', toast);

socket.on('stats', s => {
  if (S.room) S.room.stats = s;
  if (!page()) route();
});

socket.on('action', ({ type, payload, from }) => {
  playNotificationSound();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

  const o = document.createElement('div');
  o.className = 'ov';
  o.innerHTML = `<div class="card modal-anim">
    <div style="font-size:2em;margin-bottom:8px">${esc(K[type][0])}</div>
    <small style="color:var(--rgl);font-weight:700">${esc(from)}</small>
    <br><br>
    <div style="line-height:1.7">${esc(payload)}</div>
    <br>
    <button class="btn2" style="width:auto;padding:8px 16px;margin-top:12px" 
            onclick="this.closest('.ov').remove()">
      ✕ إغلاق
    </button>
  </div>`;
  document.body.append(o);
});

socket.on('diary-entry', e => {
  if (S.room) up(S.room.diary, e);
  if (page() === 'diary') list();
  if (e.from !== S.name) toast('📔 ' + e.from);
});

socket.on('diary-removed', i => {
  if (S.room) S.room.diary = S.room.diary.filter(e => e.id !== i);
  if (page() === 'diary') list();
});

socket.on('fight-entry', e => {
  if (S.room) up(S.room.fights, e);
  if (page() === 'fights') list();
});

socket.on('profiles-updated', profiles => {
  if (S.room) S.room.profiles = profiles;
  if (!page()) home();
});

socket.on('content-updated', custom => {
  if (S.room) S.room.customContent = custom;
  if (window.NYContent) window.NYContent.updateFromServer(custom);
  if (page() === 'content') renderContentEditor();
});

socket.on('chat-received', msg => {
  playNotificationSound();
  toast(`💬 ${msg.from}: ${msg.text}`);
});

// ============ Sound ============
function playNotificationSound() {
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
}

function sendChat() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  socket.emit('chat-message', { text });
  input.value = '';
  toast('📤 تم الإرسال');
}
window.sendChat = sendChat;

// ============ Header ============
const head = (title, backUrl = '#/') => `
  <div class="hd">
    <a href="${backUrl}">→</a>
    <b>${title}</b>
    <span style="width:36px"></span>
  </div>
`;

// ============ Router ============
function route() {
  const h = page();

  if (!S.room) {
    if (S.connecting) {
      // شاشة اتصال مع زر إلغاء
      app.innerHTML = `
        <div class="empty">
          <div class="empty-icon">💎</div>
          <p>جاري الاتصال...</p>
          <br>
          <button class="btn2" style="width:auto;padding:10px 20px;margin-top:20px" 
                  onclick="forceLogout()">
            ❌ إلغاء والعودة
          </button>
        </div>
      `;
    } else {
      login();
    }
    return;
  }

  if (h === 'diary') return diary();
  if (h === 'fights') return fights();
  if (h === 'settings') return settingsPage();
  if (h === 'content') return contentPage();
  if (h === 'music') return musicPage();
  if (h === 'about') return aboutPage();
  if (K[h]) return content(h);
  home();
}

addEventListener('hashchange', route);

// ============ Login ============
function login() {
  const savedName = localStorage.getItem('ny-saved-name') || S.name || '';
  
  app.innerHTML = `
    <div class="login fade-in">
      <img src="/logo.png" class="app-logo float" 
           onerror="this.style.display='none'">
      <h1 class="shimmer-logo">NY</h1>
      <p class="login-tagline">مساحتنا الخاصة</p>
      
      <input id="n" placeholder="اسمك" maxlength="20" 
             value="${esc(savedName)}">
      <input id="c" placeholder="رمز الغرفة NY-XXXX (للانضمام)" 
             maxlength="9" style="text-transform:uppercase">
      
      <button class="btn" data-a="create">✨ إنشاء غرفة جديدة</button>
      <button class="btn2" data-a="joinroom">🔗 الانضمام لغرفة</button>
    </div>
  `;
}

// ============ Home ============
function home() {
  const s = S.room.stats;
  const myProfile = window.NYProfile?.data || {};
  const myName = S.name || myProfile.name || 'أنت';

  const avatarHTML = myProfile.avatarImage
    ? `<img src="${myProfile.avatarImage}">`
    : (myProfile.avatar || '💎');

  app.innerHTML = `
    <div class="welcome-card fade-in">
      <div class="welcome-avatar">${avatarHTML}</div>
      <div class="welcome-info">
        <div class="welcome-name">${esc(myName)}</div>
        <div class="welcome-status">${esc(myProfile.status || 'أحبك')}</div>
      </div>
      <button class="logout-btn" onclick="logout()" title="تسجيل الخروج">🚪</button>
    </div>
    
    <div class="top slide-in">
      <span style="display:flex;align-items:center;gap:8px">
        <img src="/logo.png" class="app-logo-small" 
             onerror="this.style.display='none'">
        <b>${esc(S.code)}</b>
      </span>
      <span>${S.online.length > 1 ? '🟢 متصل' : '⚪ غير متصل'}</span>
    </div>
    
    <div class="grid-header">
      <span style="color:var(--mut);font-size:0.75em">🎯 الأزرار</span>
      <button class="sort-btn" id="sortToggleBtn" onclick="NYSortable.toggleEditMode(); this.textContent = NYSortable.editMode ? '✅ حفظ' : '✏️ ترتيب'">
        ✏️ ترتيب
      </button>
    </div>
    ${window.NYSortable ? window.NYSortable.renderGrid() : ''}
    
    <div class="stats fade-in">
      <div><b>${s.count}</b>فعاليات</div>
      <div><b>${s.qCount}</b>أسئلة</div>
      <div><b>${s.pCount}</b>أشعار</div>
    </div>
    
    <button class="btn2 fade-in" 
            onclick="location.hash='#/content'"
            style="margin-top:10px">
      ✨ إضافة محتوى خاص
    </button>
    <button class="btn2" onclick="location.hash='#/about'" style="margin-top:6px">
      📖 قصة NY
    </button>
    <button class="btn2" data-a="notif">🔔 تفعيل الإشعارات</button>
    <button class="btn2" onclick="changeRoom()" style="margin-top:6px">
      🔄 تغيير الغرفة
    </button>
    <button class="btn2" data-a="chatToggle" style="margin-top:6px">
      💬 دردشة سريعة
    </button>
    <div id="quickChat" class="quick-chat hidden">
      <input id="chatInput" placeholder="اكتب رسالة سريعة..." 
             onkeypress="if(event.key==='Enter')sendChat()">
      <button class="btn" onclick="sendChat()" style="width:auto;padding:12px 20px">
        📤
      </button>
    </div>
    
    <div class="music-player fade-in" id="musicPlayer">
      <button class="music-btn" onclick="NYMusic.prev()">⏮️</button>
      <button class="music-btn music-play" id="musicPlayBtn" 
              onclick="NYMusic.toggle()">▶️</button>
      <button class="music-btn" onclick="NYMusic.next()">⏭️</button>
      <div class="music-name" id="musicName" 
           onclick="location.hash='#/music'">🎵 اختر أغنية</div>
    </div>
    
    <button class="settings-fab heartbeat" 
            onclick="location.hash='#/settings'"
            title="الإعدادات">
      ⚙️
    </button>
  `;

  setTimeout(() => {
    if (!window.NYMusic?.apiLoaded) window.NYMusic?.init();
    window.NYMusic?.updateUI();
  }, 100);
}

// ============ About Page ============
function aboutPage() {
  const story = window.NYStory || {
    title: 'قصة NY',
    chapters: [
      { title: '💎 البداية', text: 'قصة NY بدأت من قلب يحب...' }
    ]
  };

  app.innerHTML = `
    ${head('📖 قصة NY')}
    
    <div class="card fade-in" style="text-align:center;padding:30px 20px">
      <img src="/logo.png" class="app-logo float" 
           onerror="this.style.display='none'"
           style="margin-bottom:15px">
      <h1 style="font-family:'Reem Kufi',serif;font-size:2.5em;letter-spacing:8px;
                 background:linear-gradient(135deg,#f4c9b8,#d4a574);
                 -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                 background-clip:text;margin-bottom:10px">
        NY
      </h1>
      <p style="color:#f4c9b8;font-size:0.95em;letter-spacing:3px;opacity:0.9">
        من القلب إلى القلب
      </p>
    </div>
    
    <div id="storyChapters"></div>
    
    <div class="card2 fade-in" style="text-align:center;margin-top:20px;padding:30px 20px;
         border:1px dashed var(--gold)">
      <div style="font-size:2em;margin-bottom:10px">💎</div>
      <p style="font-size:1.05em;color:var(--rg);font-style:italic;line-height:2">
        ${esc(story.signature || 'من قلب يحبك، إلى قلبك 💎')}
      </p>
      <p style="color:var(--mut);font-size:0.8em;margin-top:10px">
        — NY 2026
      </p>
    </div>
    
    <button class="btn2 fade-in" style="margin-top:15px" 
            onclick="location.hash='#/'">
      🏠 العودة للرئيسية
    </button>
  `;

  const chaptersEl = document.getElementById('storyChapters');
  if (chaptersEl && story.chapters) {
    chaptersEl.innerHTML = story.chapters.map((ch, i) => `
      <div class="card2 fade-in" style="margin-bottom:12px;padding:20px;
           animation-delay:${i * 0.1}s">
        <h3 style="color:var(--rg);font-family:'Reem Kufi',serif;
                   font-size:1.1em;margin-bottom:12px;letter-spacing:1px">
          ${esc(ch.title)}
        </h3>
        <p style="font-size:0.95em;line-height:2.2;color:#e0e0e0;white-space:pre-wrap">
          ${esc(ch.text)}
        </p>
      </div>
    `).join('');
  }
}

// ============ Music Page ============
function musicPage() {
  app.innerHTML = `
    ${head('🎵 الموسيقى')}
    <div class="card2 fade-in">
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:2em;margin-bottom:8px">🎵</div>
        <div style="color:var(--rg);font-weight:700" id="currentMusicName">
          ${esc(window.NYMusic?.currentName() || 'لا توجد أغنية')}
        </div>
      </div>
      
      <div style="display:flex;gap:8px;justify-content:center;margin:16px 0">
        <button class="music-btn" onclick="NYMusic.prev()">⏮️</button>
        <button class="music-btn music-play" id="musicPlayBtn" 
                onclick="NYMusic.toggle()">▶️</button>
        <button class="music-btn" onclick="NYMusic.next()">⏭️</button>
      </div>
      
      <div style="padding:8px 0;border-top:1px solid rgba(212,165,116,0.2);margin-top:12px">
        <div style="color:var(--mut);font-size:0.8em;margin-bottom:8px">
          🔊 مستوى الصوت
        </div>
        <input type="range" min="0" max="100" value="${window.NYMusic?.volume || 50}"
               oninput="NYMusic.setVolume(this.value); this.nextElementSibling.textContent = this.value + '%'"
               style="width:100%">
        <div style="color:var(--rg);font-size:0.75em;text-align:center">
          ${window.NYMusic?.volume || 50}%
        </div>
      </div>
    </div>
    
    <div class="card2 fade-in" style="margin-top:12px">
      <h4 style="color:var(--rgl);margin-bottom:12px">📋 قائمة التشغيل</h4>
      <div id="musicPlaylist"></div>
    </div>
  `;

  setTimeout(() => {
    if (!window.NYMusic?.apiLoaded) window.NYMusic?.init();
    window.NYMusic?.updateUI();
    window.NYMusic?.updatePlaylistUI();
  }, 100);
}

// ============ Settings Page ============
function settingsPage() {
  app.innerHTML = `
    ${head('⚙️ الإعدادات')}
    
    <div class="settings-tabs fade-in">
      <button data-a="tab" data-tab="profile" class="${S.currentSettingsTab === 'profile' ? 'active' : ''}">
        👤 الملف الشخصي
      </button>
      <button data-a="tab" data-tab="appearance" class="${S.currentSettingsTab === 'appearance' ? 'active' : ''}">
        🎨 المظهر
      </button>
      <button data-a="tab" data-tab="sounds" class="${S.currentSettingsTab === 'sounds' ? 'active' : ''}">
        🔔 الأصوات
      </button>
      <button data-a="tab" data-tab="relationship" class="${S.currentSettingsTab === 'relationship' ? 'active' : ''}">
        💕 العلاقة
      </button>
      <button data-a="tab" data-tab="account" class="${S.currentSettingsTab === 'account' ? 'active' : ''}">
        🚪 الحساب
      </button>
    </div>
    
    <div id="settingsContent"></div>
  `;
  renderSettingsTab();
}

function renderSettingsTab() {
  const d = window.NYSettings?.data || {};
  const content = $('#settingsContent');
  if (!content) return;

  if (S.currentSettingsTab === 'profile') {
    content.innerHTML = `
      <div class="settings-section fade-in">
        <div class="profile-header">
          <div class="profile-avatar float">
            ${d.avatarImage ? `<img src="${d.avatarImage}">` : d.avatar || '💎'}
          </div>
          <div class="profile-name">${esc(d.name || S.name)}</div>
          <div class="profile-status">${esc(d.status || 'أحبك')}</div>
        </div>
        
        <div class="setting-item">
          <label>الاسم</label>
          <input value="${esc(d.name || S.name)}" 
                 style="margin:0;width:60%;padding:8px"
                 onchange="NYSettings.set('name', this.value)">
        </div>
        
        <div class="setting-item">
          <label>الحالة</label>
          <input value="${esc(d.status || 'أحبك')}" 
                 style="margin:0;width:60%;padding:8px"
                 onchange="NYSettings.set('status', this.value)">
        </div>
        
        <div style="margin-top:16px">
          <label style="color:var(--rgl);font-size:0.9em;display:block;margin-bottom:8px">
            اختر صورة رمزية
          </label>
          <div class="avatar-grid">
            ${(window.NYSettings?.avatars || []).map(a => `
              <button class="${d.avatar === a && !d.avatarImage ? 'selected' : ''}" 
                      onclick="selectAvatar('${a}')">${a}</button>
            `).join('')}
          </div>
        </div>
        
        <div style="margin-top:16px">
          <label style="color:var(--rgl);font-size:0.9em;display:block;margin-bottom:8px">
            أو ارفع صورتك
          </label>
          <input type="file" accept="image/*" onchange="uploadAvatar(event)">
        </div>
      </div>
    `;
  }

  else if (S.currentSettingsTab === 'appearance') {
    content.innerHTML = `
      <div class="settings-section fade-in">
        <div class="setting-item">
          <label>الوضع الليلي</label>
          <div class="toggle ${d.darkMode !== false ? 'on' : ''}" 
               data-a="toggle" data-key="darkMode"></div>
        </div>
        
        <div class="setting-item">
          <label>الأنيميشن</label>
          <div class="toggle ${d.animations !== false ? 'on' : ''}" 
               data-a="toggle" data-key="animations"></div>
        </div>
        
        <div style="margin-top:20px">
          <label style="color:var(--rgl);font-size:0.9em;display:block;margin-bottom:12px">
            اختر الثيم
          </label>
          <div class="theme-grid">
            ${Object.entries(window.NYThemes || {}).map(([key, t]) => `
              <div class="theme-card ${d.theme === key ? 'selected' : ''}" 
                   onclick="selectTheme('${key}')">
                <div style="font-size:0.9em;margin-bottom:6px">${t.name}</div>
                <div class="theme-preview">
                  <span style="background:${t.rose}"></span>
                  <span style="background:${t.wine}"></span>
                  <span style="background:${t.gold}"></span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  else if (S.currentSettingsTab === 'sounds') {
    content.innerHTML = `
      <div class="settings-section fade-in">
        <div class="setting-item">
          <label>🔔 الإشعارات</label>
          <div class="toggle ${d.notifications !== false ? 'on' : ''}" 
               data-a="toggle" data-key="notifications"></div>
        </div>
        
        <div class="setting-item">
          <label>🔊 المؤثرات الصوتية</label>
          <div class="toggle ${d.sounds !== false ? 'on' : ''}" 
               data-a="toggle" data-key="sounds"></div>
        </div>
        
        <button class="btn" style="margin-top:20px" data-a="notif">
          🔔 تفعيل إشعارات Push
        </button>
      </div>
    `;
  }

  else if (S.currentSettingsTab === 'relationship') {
    content.innerHTML = `
      <div class="settings-section fade-in">
        <div class="setting-item">
          <label>رمز الغرفة</label>
          <span class="value">${esc(S.code)}</span>
        </div>
        
        <div class="setting-item">
          <label>اسم الطرف الآخر</label>
          <input value="${esc(d.partnerName || '')}" 
                 style="margin:0;width:60%;padding:8px"
                 onchange="NYSettings.set('partnerName', this.value)">
        </div>
        
        <div class="setting-item">
          <label>تاريخ بداية العلاقة</label>
          <input type="date" value="${d.relationshipStart || ''}" 
                 style="margin:0;width:60%;padding:8px"
                 onchange="NYSettings.set('relationshipStart', this.value)">
        </div>
      </div>
    `;
  }

  else if (S.currentSettingsTab === 'account') {
    content.innerHTML = `
      <div class="settings-section fade-in">
        <div class="card2" style="text-align:center;padding:20px;margin-bottom:16px">
          <div style="font-size:2em;margin-bottom:10px">👤</div>
          <div style="color:var(--rg);font-weight:700;font-size:1.1em">
            ${esc(S.name || 'مستخدم')}
          </div>
          <div style="color:var(--mut);font-size:0.8em;margin-top:6px">
            الغرفة: ${esc(S.code || '-')}
          </div>
        </div>
        
        <button class="btn" style="margin-bottom:10px" onclick="changeRoom()">
          🔄 تغيير الغرفة
        </button>
        <div style="color:var(--mut);font-size:0.75em;margin-bottom:16px;padding:0 8px;line-height:1.6">
          يخرجك من الغرفة الحالية ويحتفظ باسمك. يمكنك الدخول لغرفة جديدة.
        </div>
        
        <button class="btn2" style="margin-bottom:10px" onclick="logout()">
          🚪 تسجيل الخروج
        </button>
        <div style="color:var(--mut);font-size:0.75em;margin-bottom:16px;padding:0 8px;line-height:1.6">
          يحذف جلستك المحلية ويعيدك لشاشة الدخول.
        </div>
        
        <div style="margin-top:24px;padding:16px;background:rgba(217,83,79,0.15);border-radius:12px;border:1px solid rgba(217,83,79,0.4)">
          <div style="color:#ff8a80;font-weight:700;margin-bottom:8px;font-size:0.95em">
            ⚠️ منطقة الخطر
          </div>
          <div style="color:var(--mut);font-size:0.75em;margin-bottom:12px;line-height:1.6">
            يحذف كل البيانات: الإعدادات، الملف الشخصي، الأغاني، الترتيب.
          </div>
          <button class="btn2" onclick="resetAll()" style="background:rgba(217,83,79,0.3);color:#ff8a80;border-color:rgba(217,83,79,0.5)">
            🗑️ حذف كل البيانات
          </button>
        </div>
      </div>
    `;
  }
}

// ============ Content Page ============
function contentPage() {
  app.innerHTML = `
    ${head('✨ إضافة محتوى')}
    <div class="settings-tabs fade-in">
      <button data-a="ctab" data-tab="activities" class="${S.currentContentTab === 'activities' ? 'active' : ''}">🎲 فعاليات</button>
      <button data-a="ctab" data-tab="questions" class="${S.currentContentTab === 'questions' ? 'active' : ''}">❓ أسئلة</button>
      <button data-a="ctab" data-tab="challenges" class="${S.currentContentTab === 'challenges' ? 'active' : ''}">⚡ تحديات</button>
      <button data-a="ctab" data-tab="love" class="${S.currentContentTab === 'love' ? 'active' : ''}">💌 رسائل حب</button>
      <button data-a="ctab" data-tab="poems" class="${S.currentContentTab === 'poems' ? 'active' : ''}">📜 شعر</button>
    </div>
    <div id="contentEditor"></div>
  `;
  renderContentEditor();
}

function getTypeName(type) {
  const names = {
    activities: 'فعالية', questions: 'سؤال', challenges: 'تحدي',
    love: 'رسالة حب', poems: 'بيت شعر'
  };
  return names[type] || 'محتوى';
}

function renderContentEditor() {
  const type = S.currentContentTab || 'activities';
  const editor = document.getElementById('contentEditor');
  if (!editor) return;
  const list = S.room.customContent?.[type] || [];

  editor.innerHTML = `
    <div class="content-form fade-in">
      <textarea id="newContentText" rows="3" 
                placeholder="اكتب ${getTypeName(type)} جديدة..."></textarea>
      <button class="btn" data-a="contentadd" data-type="${type}">
        ➕ إضافة
      </button>
    </div>
    <div class="content-list">
      ${list.length ? list.map(item => `
        <div class="content-item">
          <span>${esc(item.text)}</span>
          <span class="del" onclick="NYContent.remove('${type}', '${item.id}')">🗑️</span>
        </div>
      `).join('') : '<div class="empty" style="padding:20px">لا محتوى مخصص بعد</div>'}
    </div>
  `;
}

// ============ Content (للفعاليات) ============
const fmt = (k, i) => k === 'poem'
  ? `📜 ${i.author}:\n«${i.text}»`
  : k === 'gift'
  ? `🎁 ${i.emoji} ${i.name}`
  : k === 'song'
  ? `🎵 ${i}`
  : k === 'love'
  ? `💌 ${i}`
  : i;

function content(k) {
  S.cur = null;
  app.innerHTML = `
    ${head(K[k][0] + ' ' + K[k][1])}
    <div class="card fade-in" id="card">اضغط «جديد»</div>
    <div class="row2">
      <button class="btn" data-a="gen" data-k="${k}">✨ جديد</button>
      <button class="btn2" data-a="send" data-k="${k}">💌 إرسال</button>
    </div>
  `;
}

// ============ Diary ============
function diary() {
  app.innerHTML = `
    ${head('📔 يومياتي')}
    <button class="btn2" data-a="toggle">＋ يومية جديدة</button>
    <div id="comp" ${S.open ? '' : 'hidden'}>
      <input id="t" placeholder="العنوان" maxlength="60">
      <textarea id="x" rows="4" placeholder="كيف كان يومك؟"></textarea>
      <div class="rx mood">
        ${MOODS.map(m => `<button data-a="mood" data-m="${m}" class="${m === S.mood ? 'on' : ''}">${m}</button>`).join('')}
      </div>
      <input type="file" id="files" accept="image/*" multiple>
      <div id="prev"></div>
      <button class="btn" data-a="savediary">💾 حفظ</button>
    </div>
    <div id="list"></div>
  `;
  list();
}

// ============ Fights ============
function fights() {
  app.innerHTML = `
    ${head('💢 عاتبني')}
    <button class="btn2" data-a="toggle">＋ عتاب جديد</button>
    <div id="comp" ${S.open ? '' : 'hidden'}>
      <input id="t" placeholder="العنوان" maxlength="60">
      <textarea id="x" rows="5" placeholder="فضفض هنا..."></textarea>
      <div class="rx mood">
        ${ANG.map(m => `<button data-a="anger" data-m="${m}" class="${m === S.anger ? 'on' : ''}">${m}</button>`).join('')}
      </div>
      <button class="btn" data-a="savefight">💌 أرسل العتاب</button>
    </div>
    <div id="list"></div>
  `;
  list();
}

// ============ List ============
function list() {
  const el = $('#list');
  if (!el) return;
  const d = page() === 'diary';
  const a = d ? S.room.diary : S.room.fights;
  el.innerHTML = a.length
    ? a.map(d ? dEntry : fEntry).join('')
    : `<div class="empty"><div class="empty-icon">${d ? '📔' : '💢'}</div>${d ? 'لا توجد يوميات بعد' : 'لا عتاب بينكما!'}</div>`;
}

const who = e => e.from === S.name ? 'أنت' : e.from;

function dEntry(e) {
  const me = S.name;
  const cnt = {};
  Object.values(e.reactions || {}).forEach(m => cnt[m] = (cnt[m] || 0) + 1);

  return `<div class="card2 fade-in">
    <div class="row"><b>${esc(who(e))}</b><span>${esc(e.mood || '')}</span></div>
    <h4 style="color:var(--rgl);margin:6px 0">${esc(e.title)}</h4>
    <p>${esc(e.text)}</p>
    <div>${(e.images || []).map(s => `<img src="${esc(s)}">`).join('')}</div>
    <div class="rx">
      ${EM.map(m => `
        <button data-a="react" data-id="${esc(e.id)}" data-e="${m}" 
                class="${(e.reactions || {})[me] === m ? 'on' : ''}">
          ${m} ${cnt[m] || ''}
        </button>
      `).join('')}
    </div>
    ${(e.comments || []).map(c => `<div class="cm"><b>${esc(c.from)}</b> ${esc(c.text)}</div>`).join('')}
    <div class="row">
      <input id="c${esc(e.id)}" placeholder="تعليق...">
      <button class="btn2" style="width:auto" data-a="comment" data-id="${esc(e.id)}">↩</button>
    </div>
    <small>${when(e.time)} ${e.from === me ? `<a href="#" data-a="del" data-id="${esc(e.id)}">حذف</a>` : ''}</small>
  </div>`;
}

function fEntry(e) {
  return `<div class="card2 fade-in" ${e.resolved ? 'style="opacity:.6"' : ''}>
    <div class="row"><b>${esc(who(e))}</b><span>${esc(e.anger || '')}</span></div>
    <h4 style="color:var(--rgl);margin:6px 0">${esc(e.title)}</h4>
    <p>${esc(e.text)}</p>
    ${(e.replies || []).map(c => `<div class="cm"><b>${esc(c.from)}</b> ${esc(c.text)}</div>`).join('')}
    <div class="row">
      <input id="c${esc(e.id)}" placeholder="رد...">
      <button class="btn2" style="width:auto" data-a="reply" data-id="${esc(e.id)}">↩</button>
    </div>
    <small>${when(e.time)}</small>
    ${e.resolved 
      ? '<b style="color:#6fbf73"> ✓ تم الصلح</b>' 
      : e.from !== S.name 
        ? `<button class="btn" data-a="resolve" data-id="${esc(e.id)}">💞 تم الصلح</button>` 
        : ''}
  </div>`;
}

// ============ Image Helper ============
function shrink(f) {
  return new Promise(r => {
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, 1024 / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = im.width * s;
      c.height = im.height * s;
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      r(c.toDataURL('image/jpeg', 0.75));
    };
    im.src = URL.createObjectURL(f);
  });
}

app.addEventListener('change', async e => {
  if (e.target.id !== 'files') return;
  for (const f of [...e.target.files].slice(0, 4 - S.imgs.length)) {
    S.imgs.push(await shrink(f));
  }
  $('#prev').innerHTML = S.imgs.map(s => `<img src="${s}" style="width:30%;margin:4px;border-radius:8px">`).join('');
});

const val = id => $('#' + id).value.trim();
const close = () => { S.open = false; S.imgs = []; route(); };

// ============ Actions ============
const A = {
  create() {
    S.name = val('n');
    if (!S.name) return toast('اكتب اسمك');
    if (window.NYSettings) window.NYSettings.set('name', S.name);
    if (window.NYProfile) window.NYProfile.set('name', S.name);
    localStorage.setItem('ny-saved-name', S.name);
    S.connecting = true;
    route();
    socket.emit('create', { name: S.name }, auth);
  },

  joinroom() {
    S.name = val('n');
    S.code = val('c').toUpperCase();
    if (!S.name || !S.code) return toast('اكتب الاسم والرمز');
    if (window.NYSettings) window.NYSettings.set('name', S.name);
    if (window.NYProfile) window.NYProfile.set('name', S.name);
    localStorage.setItem('ny-saved-name', S.name);
    S.connecting = true;
    route();
    socket.emit('join', { code: S.code, name: S.name }, auth);
  },

  chatToggle() {
    const chat = document.getElementById('quickChat');
    if (chat) {
      chat.classList.toggle('hidden');
      if (!chat.classList.contains('hidden')) {
        setTimeout(() => document.getElementById('chatInput')?.focus(), 100);
      }
    }
  },

  gen(d) {
    const k = d.k;
    let i;
    const contentTypeMap = {
      activity: 'activities', bold: 'activities', challenge: 'challenges',
      question: 'questions', love: 'love', poem: 'poems'
    };
    const contentType = contentTypeMap[k];

    if (contentType && window.NYContent) {
      i = pick(window.NYContent.getAll(contentType));
    } else {
      i = pick(LoveData[K[k][2]]);
    }

    S.cur = fmt(k, i);
    const c = $('#card');
    c.textContent = S.cur;
    c.classList.add('bounce-in');
    setTimeout(() => c.classList.remove('bounce-in'), 700);
  },

  send(d) {
    if (!S.cur) return toast('اضغط «جديد» أولاً');
    socket.emit('action', { type: d.k, payload: S.cur });
    toast('💌 تم الإرسال');
  },

  toggle() {
    S.open = !S.open;
    $('#comp').hidden = !S.open;
  },

  mood(d) { S.mood = d.m; diary(); },
  anger(d) { S.anger = d.m; S.open = true; fights(); },

  savediary() {
    const title = val('t');
    const text = val('x');
    if (!title && !text) return toast('اكتب شيئاً');
    socket.emit('diary-add', { entry: { title, text, mood: S.mood, images: S.imgs } });
    close();
  },

  savefight() {
    const title = val('t');
    const text = val('x');
    if (!title && !text) return toast('اكتب عتابك');
    socket.emit('fight-add', { entry: { title, text, anger: S.anger } });
    close();
  },

  react(d) { socket.emit('diary-react', { id: d.id, emoji: d.e }); },
  del(d) { if (confirm('حذف اليومية؟')) socket.emit('diary-delete', { id: d.id }); },
  comment(d) {
    const i = $('#c' + d.id);
    if (i.value.trim()) socket.emit('diary-comment', { id: d.id, text: i.value });
  },
  reply(d) {
    const i = $('#c' + d.id);
    if (i.value.trim()) socket.emit('fight-reply', { id: d.id, text: i.value });
  },
  resolve(d) { socket.emit('fight-resolve', { id: d.id, resolved: true }); },

  tab(d) { S.currentSettingsTab = d.tab; settingsPage(); },
  ctab(d) { S.currentContentTab = d.tab; contentPage(); },

  contentadd(d) {
    const text = $('#newContentText')?.value.trim();
    if (!text) return toast('اكتب شيئاً');
    if (window.NYContent) {
      window.NYContent.add(d.type, text);
      setTimeout(() => { const ta = $('#newContentText'); if (ta) ta.value = ''; }, 100);
      toast('✅ تم الإضافة');
    }
  },

  toggle(d) {
    const key = d.key;
    if (window.NYSettings) {
      const current = window.NYSettings.get(key);
      window.NYSettings.set(key, !current);
      renderSettingsTab();
      toast('✅ تم التحديث');
    }
  },

  clearsettings() {
    if (!confirm('مسح كل الإعدادات؟')) return;
    localStorage.removeItem('ny-settings');
    location.reload();
  },

  async notif() {
    try {
      const { key } = await (await fetch('/api/vapid')).json();
      if (!key) return toast('مفاتيح VAPID غير مضبوطة');
      if (await Notification.requestPermission() !== 'granted') return toast('لم يتم السماح');
      const reg = await navigator.serviceWorker.ready;
      const pad = '='.repeat((4 - key.length % 4) % 4);
      const b = atob((key + pad).replace(/-/g, '+').replace(/_/g, '/'));
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: Uint8Array.from(b, c => c.charCodeAt(0))
      });
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: S.code, name: S.name, sub })
      });
      toast('🔔 تم تفعيل الإشعارات');
    } catch (e) {
      toast('على iPad: أضف التطبيق للشاشة الرئيسية أولاً');
    }
  }
};

window.selectAvatar = function(avatar) {
  if (window.NYSettings) {
    window.NYSettings.set('avatar', avatar);
    window.NYSettings.set('avatarImage', null);
    if (window.NYProfile) {
      window.NYProfile.set('avatar', avatar);
      window.NYProfile.set('avatarImage', null);
    }
    renderSettingsTab();
    toast('✅ تم اختيار الصورة');
  }
};

window.selectTheme = function(themeKey) {
  if (window.NYSettings) {
    window.NYSettings.set('theme', themeKey);
    renderSettingsTab();
    toast('🎨 تم تغيير الثيم');
  }
};

window.uploadAvatar = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return toast('الصورة كبيرة (الحد 2MB)');
  const data = await shrink(file);
  if (window.NYSettings) {
    window.NYSettings.set('avatarImage', data);
    if (window.NYProfile) window.NYProfile.set('avatarImage', data);
    renderSettingsTab();
    toast('✅ تم رفع الصورة');
  }
};

app.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (b && A[b.dataset.a]) {
    e.preventDefault();
    A[b.dataset.a](b.dataset, b);
  }
});

document.addEventListener('click', e => {
  const b = e.target.closest('.ov');
  if (b) b.remove();
});

console.log('💎 NY v9.0 ready — with account management');