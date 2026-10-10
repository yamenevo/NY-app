// ============ NY Song of the Week ============
window.NYSongWeek = {
  render() {
    const current = window.NY.S.room?.songOfWeek;
    const archive = window.NY.S.room?.songsArchive || [];

    return `
      <div style="padding:12px">
        <div class="card" style="padding:20px;text-align:center;margin-bottom:16px">
          <div style="font-size:2em;margin-bottom:8px">🎵</div>
          <div style="color:var(--rg);font-weight:700">أغنية الأسبوع</div>
        </div>

        ${current ? `
          <div class="card" style="padding:20px;text-align:center;margin-bottom:16px;background:linear-gradient(135deg,var(--wine),var(--rgd))">
            <div style="font-size:2.5em;margin-bottom:8px">🎵</div>
            <div style="color:white;font-weight:700;font-size:1.05em">${window.NY.esc(current.title)}</div>
            <div style="color:var(--rgl);font-size:0.85em;margin-top:6px">${window.NY.esc(current.artist || '')}</div>
            <div style="color:var(--rgl);font-size:0.75em;margin-top:8px;opacity:0.8">
              من ${window.NY.esc(current.from)} — ${window.NY.when(current.time)}
            </div>
            ${current.link ? `
              <a href="${current.link}" target="_blank" style="display:inline-block;margin-top:12px;padding:8px 20px;background:white;color:var(--wine);border-radius:10px;text-decoration:none;font-weight:700">
                ▶️ تشغيل
              </a>
            ` : ''}
          </div>
        ` : `
          <div class="empty" style="margin-bottom:16px">
            <div class="empty-icon">🎵</div>
            <p>لا توجد أغنية الأسبوع بعد</p>
          </div>
        `}

        <button class="btn" onclick="NYSongWeek.propose()">➕ اقترح أغنية</button>

        ${archive.length ? `
          <h3 style="color:var(--rg);font-size:0.95em;margin:20px 0 12px">📚 الأرشيف</h3>
          ${archive.slice(0, 10).map(s => `
            <div class="card2" style="padding:12px;margin-bottom:8px">
              <div style="color:var(--rgl);font-size:0.9em">🎵 ${window.NY.esc(s.title)}</div>
              <div style="color:var(--mut);font-size:0.75em;margin-top:4px">
                ${window.NY.esc(s.artist || '')} — ${window.NY.when(s.time)}
              </div>
            </div>
          `).join('')}
        ` : ''}
      </div>
    `;
  },

  propose() {
    const title = prompt('اسم الأغنية:');
    if (!title) return;
    const artist = prompt('المطرب (اختياري):') || '';
    const link = prompt('رابط (اختياري):') || '';
    window.NY.socket.emit('song-week-add', { title, artist, link });
  }
};

if (window.NY && window.NY.socket) {
  window.NY.socket.on('song-week-updated', ({ current, archive }) => {
    if (!window.NY.S.room) return;
    window.NY.S.room.songOfWeek = current;
    window.NY.S.room.songsArchive = archive;
    if (document.getElementById('fullScreenPage')) {
      const page = document.getElementById('fullScreenPage');
      const title = page.querySelector('b')?.textContent || '';
      if (title.includes('أغنية الأسبوع')) {
        page.querySelector('div:last-child').innerHTML = window.NYSongWeek.render();
      }
    }
  });
}

console.log('✅ NY SongWeek loaded');