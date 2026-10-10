// ============ NY Messages — رسائل مجدولة + زجاجة ============
window.NYMessages = {
  render() {
    const scheduled = (window.NY.S.room?.scheduled || []).sort((a, b) => a.sendAt - b.sendAt);
    const bottles = window.NY.S.room?.bottles || [];

    return `
      <div class="messages-container">
        <div class="sub-tabs">
          <button class="active" onclick="NYMessages.setTab('scheduled')">📅 مجدولة</button>
          <button onclick="NYMessages.setTab('bottles')">💌 زجاجة</button>
        </div>

        <div id="messagesContent">
          ${this.renderScheduled(scheduled)}
        </div>
      </div>
    `;
  },

  currentTab: 'scheduled',

  setTab(tab) {
    this.currentTab = tab;
    const content = document.getElementById('messagesContent');
    if (!content) return;
    
    document.querySelectorAll('.sub-tabs button').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'scheduled') {
      content.innerHTML = this.renderScheduled(
        (window.NY.S.room?.scheduled || []).sort((a, b) => a.sendAt - b.sendAt)
      );
    } else {
      content.innerHTML = this.renderBottles(window.NY.S.room?.bottles || []);
    }
  },

  renderScheduled(list) {
    const pending = list.filter(m => m.sendAt > Date.now());
    const sent = list.filter(m => m.sendAt <= Date.now());

    return `
      <button class="btn" onclick="NYMessages.addScheduled()" style="margin-bottom:12px">
        💌 رسالة مجدولة جديدة
      </button>

      ${pending.length ? `
        <h3 style="color:var(--rg);font-size:0.95em;margin:12px 0 8px">⏳ قادمة</h3>
        ${pending.map(m => this.scheduledCard(m, true)).join('')}
      ` : ''}

      ${sent.length ? `
        <h3 style="color:var(--rg);font-size:0.95em;margin:12px 0 8px">✅ أُرسلت</h3>
        ${sent.map(m => this.scheduledCard(m, false)).join('')}
      ` : ''}

      ${!list.length ? `
        <div class="empty">
          <div class="empty-icon">📅</div>
          <p>لا توجد رسائل مجدولة</p>
        </div>
      ` : ''}
    `;
  },

  scheduledCard(m, isPending) {
    const date = new Date(m.sendAt);
    const daysLeft = Math.ceil((m.sendAt - Date.now()) / 86400000);
    
    return `
      <div class="card2" style="margin-bottom:10px;padding:14px">
        <div style="color:var(--rgl);font-weight:600;margin-bottom:6px">
          ${m.title || 'رسالة حب'}
        </div>
        <div style="color:#e0e0e0;font-size:0.85em;line-height:1.6;margin-bottom:8px">
          ${window.NY.esc(m.text.slice(0, 100))}${m.text.length > 100 ? '...' : ''}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.75em;color:var(--mut)">
          <span>📅 ${date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>${isPending ? `بعد ${daysLeft} يوم` : '✅ أُرسلت'}</span>
        </div>
      </div>
    `;
  },

  addScheduled() {
    const overlay = document.createElement('div');
    overlay.className = 'ov';
    overlay.innerHTML = `
      <div class="card2" style="max-width:400px;width:100%;padding:20px">
        <h3 style="color:var(--rg);margin-bottom:16px;text-align:center">💌 رسالة مجدولة</h3>
        
        <input type="text" id="msgTitle" placeholder="العنوان (مثل: عيد ميلادك)" maxlength="60">
        <textarea id="msgText" rows="4" placeholder="نص الرسالة..." maxlength="1000"></textarea>
        <label style="color:var(--rgl);font-size:0.85em;margin:10px 0 4px;display:block">📅 موعد الوصول:</label>
        <input type="datetime-local" id="msgDate">
        
        <div style="display:flex;gap:8px;margin-top:16px">
          <button class="btn" style="flex:1" onclick="NYMessages.saveScheduled()">💾 جدولة</button>
          <button class="btn2" style="flex:1" onclick="this.closest('.ov').remove()">❌ إلغاء</button>
        </div>
      </div>
    `;
    document.body.append(overlay);
    
    setTimeout(() => {
      const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const inp = document.getElementById('msgDate');
      if (inp) inp.value = d.toISOString().slice(0, 16);
    }, 100);
  },

  saveScheduled() {
    const title = document.getElementById('msgTitle')?.value.trim();
    const text = document.getElementById('msgText')?.value.trim();
    const dateStr = document.getElementById('msgDate')?.value;

    if (!text) return window.NY.toast('اكتب نص الرسالة');
    if (!dateStr) return window.NY.toast('اختر التاريخ');

    const sendAt = new Date(dateStr).getTime();
    if (sendAt <= Date.now()) return window.NY.toast('الموعد يجب أن يكون في المستقبل');

    window.NY.socket.emit('scheduled-add', { title, text, sendAt });
    document.querySelector('.ov')?.remove();
    window.NY.toast('📅 تمّت الجدولة');
  },

  renderBottles(list) {
    return `
      <button class="btn" onclick="NYMessages.addBottle()" style="margin-bottom:12px">
        🍾 رسالة في زجاجة
      </button>
      
      <div style="color:var(--mut);font-size:0.8em;text-align:center;margin-bottom:12px">
        اكتب رسالة، وستظهر عشوائياً في وقت لاحق 💕
      </div>

      ${list.length ? list.map(b => `
        <div class="card2" style="margin-bottom:10px;padding:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span style="color:var(--rg);font-weight:600">🍾 ${window.NY.esc(b.title || 'رسالة')}</span>
            <span style="color:var(--mut);font-size:0.75em">${window.NY.esc(b.from)}</span>
          </div>
          <div style="color:#c0c0d0;font-size:0.85em;font-style:italic">
            🔒 مخفية — ستظهر عندما يحين وقتها
          </div>
        </div>
      `).join('') : `
        <div class="empty">
          <div class="empty-icon">🍾</div>
          <p>لا توجد رسائل في زجاجات</p>
        </div>
      `}
    `;
  },

  addBottle() {
    const title = prompt('عنوان الرسالة (اختياري):', '') || 'رسالة حب';
    const text = prompt('نص الرسالة:');
    if (!text) return;
    window.NY.socket.emit('bottle-add', { title, text });
    window.NY.toast('🍾 تمّت الإضافة');
  }
};

// Socket
if (window.NY && window.NY.socket) {
  window.NY.socket.on('scheduled-entry', item => {
    if (!window.NY.S.room) return;
    if (!window.NY.S.room.scheduled) window.NY.S.room.scheduled = [];
    window.NY.up(window.NY.S.room.scheduled, item);
    if (window.NY.S.currentTab === 'memories') window.NY.renderTab('memories');
  });

  window.NY.socket.on('scheduled-delivered', item => {
    window.NY.playNotificationSound();
    const o = document.createElement('div');
    o.className = 'ov';
    o.innerHTML = `<div class="card modal-anim">
      <div style="font-size:2em;margin-bottom:8px">💌</div>
      <div style="color:var(--rgl);font-weight:700">${window.NY.esc(item.title || 'رسالة حب')}</div>
      <br>
      <div style="line-height:1.8">${window.NY.esc(item.text)}</div>
      <br>
      <small style="color:var(--mut)">— من ${window.NY.esc(item.from)}</small>
      <br><br>
      <button class="btn2" style="width:auto;padding:8px 16px" 
              onclick="this.closest('.ov').remove()">✕ إغلاق</button>
    </div>`;
    document.body.append(o);
  });

  window.NY.socket.on('bottle-entry', item => {
    if (!window.NY.S.room) return;
    if (!window.NY.S.room.bottles) window.NY.S.room.bottles = [];
    window.NY.S.room.bottles.push(item);
  });

  window.NY.socket.on('bottle-open', item => {
    window.NY.playNotificationSound();
    const o = document.createElement('div');
    o.className = 'ov';
    o.innerHTML = `<div class="card modal-anim">
      <div style="font-size:2em;margin-bottom:8px">🍾</div>
      <div style="color:var(--rgl);font-weight:700">${window.NY.esc(item.title || 'رسالة')}</div>
      <br>
      <div style="line-height:1.8">${window.NY.esc(item.text)}</div>
      <br>
      <small style="color:var(--mut)">— من ${window.NY.esc(item.from)}</small>
      <br><br>
      <button class="btn2" style="width:auto;padding:8px 16px" 
              onclick="this.closest('.ov').remove()">✕ إغلاق</button>
    </div>`;
    document.body.append(o);
  });
}

console.log('✅ NY Messages loaded');