// ============ NY Album — ألبوم الصور ============
window.NYAlbum = {
  categories: ['الكل', 'رومانسي', 'مضحك', 'ذكريات', 'رحلة', 'مفاجآت'],
  currentCategory: 'الكل',

  render() {
    const photos = this.getPhotos();
    const filtered = this.currentCategory === 'الكل'
      ? photos
      : photos.filter(p => p.category === this.currentCategory);

    return `
      <div class="album-container">
        <div class="sub-tabs">
          ${this.categories.map(c => `
            <button class="${this.currentCategory === c ? 'active' : ''}" 
                    onclick="NYAlbum.setCategory('${c}')">${c}</button>
          `).join('')}
        </div>

        <button class="btn" onclick="NYAlbum.pickPhoto()" style="margin-bottom:12px">
          📸 إضافة صورة جديدة
        </button>

        ${filtered.length ? `
          <div class="album-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
            ${filtered.map(p => `
              <div class="album-item" style="
                border-radius:14px;overflow:hidden;position:relative;
                border:1px solid rgba(212,165,116,0.3);background:rgba(232,180,160,0.06);
                cursor:pointer;transition:transform 0.3s"
                onclick="NYAlbum.viewPhoto('${p.id}')">
                <img src="${p.image}" style="width:100%;height:150px;object-fit:cover;display:block">
                <div style="padding:8px">
                  <div style="font-size:0.8em;color:var(--rgl);font-weight:600">
                    ${window.NY.esc(p.caption || 'بدون وصف')}
                  </div>
                  <div style="font-size:0.7em;color:var(--mut);margin-top:4px">
                    ${window.NY.esc(p.from)} • ${this.timeAgo(p.time)}
                  </div>
                </div>
                ${p.from === window.NY.S.name ? `
                  <button onclick="event.stopPropagation(); NYAlbum.deletePhoto('${p.id}')" 
                          style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.7);
                                 color:white;width:28px;height:28px;border-radius:50%;
                                 border:0;cursor:pointer;font-size:0.8em">🗑️</button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty">
            <div class="empty-icon">📸</div>
            <p>لا توجد صور بعد.<br>أضف أول صورة!</p>
          </div>
        `}

        <input type="file" id="albumInput" accept="image/*" style="display:none" onchange="NYAlbum.handlePhoto(event)">
      </div>
    `;
  },

  getPhotos() {
    return (window.NY.S.room?.album || []).sort((a, b) => b.time - a.time);
  },

  setCategory(c) {
    this.currentCategory = c;
    window.NY.renderTab('memories');
  },

  pickPhoto() {
    document.getElementById('albumInput')?.click();
  },

  async handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return window.NY.toast('الصورة كبيرة (الحد 3MB)');

    const caption = prompt('وصف الصورة (اختياري):', '');
    const category = prompt('اختر التصنيف: رومانسي / مضحك / ذكريات / رحلة / مفاجآت', 'ذكريات') || 'ذكريات';

    const data = await this.shrinkImage(file);
    window.NY.socket.emit('album-add', {
      image: data,
      caption: (caption || '').slice(0, 100),
      category: category
    });
    e.target.value = '';
    window.NY.toast('📸 جاري الرفع...');
  },

  shrinkImage(f) {
    return new Promise(r => {
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, 1200 / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = im.width * s;
        c.height = im.height * s;
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        r(c.toDataURL('image/jpeg', 0.75));
      };
      im.src = URL.createObjectURL(f);
    });
  },

  viewPhoto(id) {
    const p = this.getPhotos().find(x => x.id === id);
    if (!p) return;

    const overlay = document.createElement('div');
    overlay.className = 'ov';
    overlay.style.background = 'rgba(0,0,0,0.95)';
    overlay.innerHTML = `
      <div style="max-width:100%;max-height:100%;display:flex;flex-direction:column;align-items:center;padding:20px">
        <img src="${p.image}" style="max-width:100%;max-height:75vh;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.7)">
        <div style="color:white;text-align:center;margin-top:16px;max-width:500px">
          <div style="font-size:1.1em;color:var(--rg);font-weight:600">${window.NY.esc(p.caption || '')}</div>
          <div style="font-size:0.8em;color:var(--mut);margin-top:8px">
            ${window.NY.esc(p.from)} • ${window.NY.when(p.time)} • ${window.NY.esc(p.category || '')}
          </div>
          <button class="btn2" style="width:auto;padding:10px 24px;margin-top:16px" 
                  onclick="this.closest('.ov').remove()">✕ إغلاق</button>
        </div>
      </div>
    `;
    document.body.append(overlay);
  },

  deletePhoto(id) {
    if (!confirm('حذف هذه الصورة؟')) return;
    window.NY.socket.emit('album-delete', { id });
  },

  timeAgo(t) {
    const diff = Date.now() - t;
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (min < 1) return 'الآن';
    if (min < 60) return `قبل ${min} د`;
    if (hr < 24) return `قبل ${hr} س`;
    if (day < 7) return `قبل ${day} ي`;
    return new Date(t).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  }
};

// Socket listeners
if (window.NY && window.NY.socket) {
  window.NY.socket.on('album-entry', item => {
    if (!window.NY.S.room) return;
    if (!window.NY.S.room.album) window.NY.S.room.album = [];
    window.NY.up(window.NY.S.room.album, item);
    if (window.NY.S.currentTab === 'memories') window.NY.renderTab('memories');
    if (item.from !== window.NY.S.name) {
      window.NY.playNotificationSound();
      window.NY.toast('📸 ' + item.from + ' أضاف صورة');
    }
  });

  window.NY.socket.on('album-removed', id => {
    if (!window.NY.S.room) return;
    window.NY.S.room.album = (window.NY.S.room.album || []).filter(p => p.id !== id);
    if (window.NY.S.currentTab === 'memories') window.NY.renderTab('memories');
  });
}

console.log('✅ NY Album loaded');