// ============ NY Memories — تقويم الذكريات ============
window.NYMemories = {
  render() {
    const memories = (window.NY.S.room?.memories || []).sort((a, b) => a.date - b.date);
    const upcoming = memories.filter(m => m.date > Date.now());
    const past = memories.filter(m => m.date <= Date.now()).reverse();

    return `
      <div class="memories-container">
        <button class="btn" onclick="NYMemories.addMemory()" style="margin-bottom:12px">
          📅 إضافة ذكرى جديدة
        </button>

        ${upcoming.length ? `
          <h3 style="color:var(--rg);font-family:'Reem Kufi',serif;margin:16px 0 8px;font-size:1em">
            ⏳ قادمة
          </h3>
          ${upcoming.map(m => this.renderMemoryCard(m, true)).join('')}
        ` : ''}

        ${past.length ? `
          <h3 style="color:var(--rg);font-family:'Reem Kufi',serif;margin:16px 0 8px;font-size:1em">
            💎 ذكرياتنا
          </h3>
          ${past.map(m => this.renderMemoryCard(m, false)).join('')}
        ` : ''}

        ${!memories.length ? `
          <div class="empty">
            <div class="empty-icon">📅</div>
            <p>لا توجد ذكريات محفوظة.<br>أضف أول ذكرى!</p>
          </div>
        ` : ''}
      </div>
    `;
  },

  renderMemoryCard(m, isUpcoming) {
    const date = new Date(m.date);
    const daysLeft = Math.ceil((m.date - Date.now()) / 86400000);
    const daysPassed = Math.floor((Date.now() - m.date) / 86400000);
    
    let countdown = '';
    if (isUpcoming) {
      if (daysLeft === 0) countdown = '🎉 اليوم!';
      else if (daysLeft === 1) countdown = 'غداً';
      else countdown = `بعد ${daysLeft} يوم`;
    } else {
      if (daysPassed === 0) countdown = 'اليوم';
      else if (daysPassed === 1) countdown = 'أمس';
      else if (daysPassed < 30) countdown = `قبل ${daysPassed} يوم`;
      else if (daysPassed < 365) countdown = `قبل ${Math.floor(daysPassed / 30)} شهر`;
      else countdown = `قبل ${Math.floor(daysPassed / 365)} سنة`;
    }

    const emoji = m.emoji || '💎';

    return `
      <div class="card2" style="margin-bottom:10px;position:relative;padding:16px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:2em">${emoji}</div>
          <div style="flex:1;text-align:right">
            <div style="color:var(--rgl);font-weight:700;font-size:1em">${window.NY.esc(m.title)}</div>
            <div style="color:var(--mut);font-size:0.8em;margin-top:4px">
              ${date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style="color:var(--rg);font-size:0.85em;font-weight:600;margin-top:6px">
              ${countdown}
            </div>
          </div>
          ${m.from === window.NY.S.name ? `
            <button onclick="NYMemories.deleteMemory('${m.id}')" 
                    style="background:transparent;border:0;color:#d9534f;font-size:1.1em;cursor:pointer">🗑️</button>
          ` : ''}
        </div>
        ${m.note ? `<div style="margin-top:10px;color:#c0c0d0;font-size:0.85em;line-height:1.6">${window.NY.esc(m.note)}</div>` : ''}
      </div>
    `;
  },

  addMemory() {
    const overlay = document.createElement('div');
    overlay.className = 'ov';
    overlay.innerHTML = `
      <div class="card2" style="max-width:400px;width:100%;padding:20px">
        <h3 style="color:var(--rg);margin-bottom:16px;text-align:center">📅 ذكرى جديدة</h3>
        
        <input type="text" id="memTitle" placeholder="عنوان الذكرى (مثل: أول لقاء)" maxlength="60">
        <input type="date" id="memDate">
        <textarea id="memNote" rows="3" placeholder="ملاحظات (اختياري)" maxlength="300"></textarea>
        
        <div style="margin:10px 0">
          <label style="color:var(--rgl);font-size:0.85em;margin-bottom:6px;display:block">اختر إيموجي:</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${['💎', '💕', '🌹', '🎂', '🎉', '💍', '🏖️', '🌙', '⭐', '🎁', '💌', '🥰'].map(e => `
              <button type="button" onclick="NYMemories.selectEmoji(this, '${e}')" 
                      style="background:rgba(232,180,160,0.1);border:2px solid transparent;border-radius:10px;font-size:1.4em;padding:6px 10px;cursor:pointer">
                ${e}
              </button>
            `).join('')}
          </div>
        </div>
        
        <div style="display:flex;gap:8px;margin-top:16px">
          <button class="btn" style="flex:1" onclick="NYMemories.saveMemory()">💾 حفظ</button>
          <button class="btn2" style="flex:1" onclick="this.closest('.ov').remove()">❌ إلغاء</button>
        </div>
      </div>
    `;
    document.body.append(overlay);
    
    // تعيين تاريخ اليوم افتراضياً
    setTimeout(() => {
      const dateInput = document.getElementById('memDate');
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    }, 100);
  },

  selectedEmoji: '💎',
  selectEmoji(btn, emoji) {
    document.querySelectorAll('#memTitle')?.forEach(() => {});
    document.querySelectorAll('button[type="button"]').forEach(b => b.style.borderColor = 'transparent');
    btn.style.borderColor = 'var(--rg)';
    this.selectedEmoji = emoji;
  },

  saveMemory() {
    const title = document.getElementById('memTitle')?.value.trim();
    const date = document.getElementById('memDate')?.value;
    const note = document.getElementById('memNote')?.value.trim();

    if (!title) return window.NY.toast('اكتب عنوان الذكرى');
    if (!date) return window.NY.toast('اختر التاريخ');

    window.NY.socket.emit('memory-add', {
      title,
      date: new Date(date).getTime(),
      note: note || '',
      emoji: this.selectedEmoji
    });
    
    document.querySelector('.ov')?.remove();
    window.NY.toast('💾 تم الحفظ');
  },

  deleteMemory(id) {
    if (!confirm('حذف هذه الذكرى؟')) return;
    window.NY.socket.emit('memory-delete', { id });
  }
};

// Socket listeners
if (window.NY && window.NY.socket) {
  window.NY.socket.on('memory-entry', item => {
    if (!window.NY.S.room) return;
    if (!window.NY.S.room.memories) window.NY.S.room.memories = [];
    window.NY.up(window.NY.S.room.memories, item);
    if (window.NY.S.currentTab === 'memories') window.NY.renderTab('memories');
    if (item.from !== window.NY.S.name) {
      window.NY.toast('📅 ' + item.from + ' أضاف ذكرى');
    }
  });

  window.NY.socket.on('memory-removed', id => {
    if (!window.NY.S.room) return;
    window.NY.S.room.memories = (window.NY.S.room.memories || []).filter(m => m.id !== id);
    if (window.NY.S.currentTab === 'memories') window.NY.renderTab('memories');
  });
}

console.log('✅ NY Memories loaded');