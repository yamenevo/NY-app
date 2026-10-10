// ============ NY Ideas Notebook ============
window.NYIdeas = {
  render() {
    const ideas = window.NY.S.room?.ideas || [];
    const myName = window.NY.S.name;

    return `
      <div style="padding:12px">
        <div class="card" style="padding:20px;text-align:center;margin-bottom:16px">
          <div style="font-size:2em;margin-bottom:8px">💭</div>
          <div style="color:var(--rg);font-weight:700">مفكرة الأفكار</div>
          <div style="color:var(--mut);font-size:0.8em;margin-top:6px">
            أفكار للقاء، هدايا، مفاجآت
          </div>
        </div>

        <div class="card2" style="padding:14px;margin-bottom:12px">
          <input id="ideaText" placeholder="اكتب فكرة جديدة..." style="margin:0 0 8px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <button class="btn" onclick="NYIdeas.add('فكرة')">➕ فكرة</button>
            <button class="btn2" onclick="NYIdeas.add('لما نلتقي')">📍 لقاء</button>
          </div>
        </div>

        ${ideas.length ? ideas.map(i => `
          <div class="card2" style="padding:12px;margin-bottom:8px;${i.done ? 'opacity:0.6' : ''}">
            <div style="display:flex;align-items:flex-start;gap:8px">
              <button onclick="NYIdeas.toggle('${i.id}')" 
                      style="background:transparent;border:2px solid var(--rg);border-radius:50%;width:26px;height:26px;flex-shrink:0;cursor:pointer;color:var(--rg);font-size:1em">
                ${i.done ? '✓' : ''}
              </button>
              <div style="flex:1;text-align:right">
                <div style="color:var(--rgl);${i.done ? 'text-decoration:line-through' : ''};font-size:0.9em">
                  ${window.NY.esc(i.text)}
                </div>
                <div style="color:var(--mut);font-size:0.7em;margin-top:4px">
                  <span style="background:rgba(232,180,160,0.15);padding:2px 8px;border-radius:8px">${window.NY.esc(i.tag || 'فكرة')}</span>
                  <span style="margin-right:8px">${window.NY.esc(i.from)}</span>
                </div>
              </div>
              ${i.from === myName ? `
                <button onclick="NYIdeas.remove('${i.id}')" 
                        style="background:transparent;border:0;color:#d9534f;cursor:pointer;font-size:1em">🗑️</button>
              ` : ''}
            </div>
          </div>
        `).join('') : `
          <div class="empty">
            <div class="empty-icon">💭</div>
            <p>لا توجد أفكار بعد</p>
          </div>
        `}
      </div>
    `;
  },

  add(tag) {
    const text = document.getElementById('ideaText')?.value.trim();
    if (!text) return window.NY.toast('اكتب فكرة');
    window.NY.socket.emit('idea-add', { text, tag });
    document.getElementById('ideaText').value = '';
    window.NY.toast('✅ تمت الإضافة');
  },

  toggle(id) {
    window.NY.socket.emit('idea-toggle', { id });
  },

  remove(id) {
    if (!confirm('حذف الفكرة؟')) return;
    window.NY.socket.emit('idea-remove', { id });
  }
};

if (window.NY && window.NY.socket) {
  window.NY.socket.on('ideas-updated', ideas => {
    if (!window.NY.S.room) return;
    window.NY.S.room.ideas = ideas;
    if (document.getElementById('fullScreenPage')) {
      const page = document.getElementById('fullScreenPage');
      const title = page.querySelector('b')?.textContent || '';
      if (title.includes('مفكرة')) {
        page.querySelector('div:last-child').innerHTML = window.NYIdeas.render();
      }
    }
  });
}

console.log('✅ NY Ideas loaded');