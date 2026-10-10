// ============ NY Shared Diary ============
window.NYSharedDiary = {
  render() {
    const entries = window.NY.S.room?.sharedDiary || [];

    return `
      <div style="padding:12px">
        <div class="card" style="padding:20px;text-align:center;margin-bottom:16px">
          <div style="font-size:2em;margin-bottom:8px">📖</div>
          <div style="color:var(--rg);font-weight:700">يومياتنا المشتركة</div>
          <div style="color:var(--mut);font-size:0.8em;margin-top:6px">
            اكتبا معاً — كلاكما يضيف
          </div>
        </div>

        <div class="card2" style="padding:14px;margin-bottom:16px">
          <textarea id="sharedDiaryText" rows="3" 
                    placeholder="اكتب هنا... (كلاكما يرى ويضيف)" 
                    style="margin:0 0 8px"></textarea>
          <button class="btn" onclick="NYSharedDiary.add()">➕ إضافة</button>
        </div>

        ${entries.length ? entries.map(e => `
          <div class="card2" style="padding:12px;margin-bottom:8px">
            <div style="color:var(--rgl);font-weight:600;font-size:0.85em;margin-bottom:6px">
              ${window.NY.esc(e.from)}
            </div>
            <div style="color:#e0e0e0;font-size:0.9em;line-height:1.7">${window.NY.esc(e.text)}</div>
            <div style="color:var(--mut);font-size:0.7em;margin-top:6px">${window.NY.when(e.time)}</div>
          </div>
        `).join('') : `
          <div class="empty">
            <div class="empty-icon">📖</div>
            <p>اليوميات المشتركة فارغة</p>
          </div>
        `}
      </div>
    `;
  },

  add() {
    const text = document.getElementById('sharedDiaryText')?.value.trim();
    if (!text) return window.NY.toast('اكتب شيئاً');
    window.NY.socket.emit('shared-diary-add', { text });
    document.getElementById('sharedDiaryText').value = '';
    window.NY.toast('✅ تمت الإضافة');
  }
};

if (window.NY && window.NY.socket) {
  window.NY.socket.on('shared-diary-updated', entries => {
    if (!window.NY.S.room) return;
    window.NY.S.room.sharedDiary = entries;
    if (document.getElementById('fullScreenPage')) {
      const page = document.getElementById('fullScreenPage');
      const title = page.querySelector('b')?.textContent || '';
      if (title.includes('مشتركة')) {
        page.querySelector('div:last-child').innerHTML = window.NYSharedDiary.render();
      }
    }
  });
}

console.log('✅ NY SharedDiary loaded');