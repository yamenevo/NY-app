// ============ NY Goals Jar ============
window.NYGoals = {
  render() {
    const goals = window.NY.S.room?.goals || [];

    return `
      <div style="padding:12px">
        <div class="card" style="padding:20px;text-align:center;margin-bottom:16px">
          <div style="font-size:2em;margin-bottom:8px">💰</div>
          <div style="color:var(--rg);font-weight:700">حصالة الأهداف</div>
          <div style="color:var(--mut);font-size:0.8em;margin-top:6px">
            أهدافكما المشتركة
          </div>
        </div>

        <button class="btn" onclick="NYGoals.addGoal()" style="margin-bottom:16px">
          ➕ هدف جديد
        </button>

        ${goals.length ? goals.map(g => {
          const percent = Math.min(100, Math.round((g.current / g.target) * 100));
          return `
            <div class="card2" style="padding:14px;margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <div style="color:var(--rgl);font-weight:600;font-size:0.95em">${window.NY.esc(g.title)}</div>
                <div style="color:var(--rg);font-weight:700">${percent}%</div>
              </div>
              ${g.note ? `<div style="color:var(--mut);font-size:0.8em;margin-bottom:8px">${window.NY.esc(g.note)}</div>` : ''}
              <div style="background:rgba(232,180,160,0.15);height:10px;border-radius:5px;overflow:hidden">
                <div style="background:linear-gradient(90deg,var(--wine),var(--rg));height:100%;width:${percent}%;transition:width 0.5s"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:0.8em">
                <span style="color:var(--rg)">${g.current} / ${g.target}</span>
                <button class="btn2" style="width:auto;padding:4px 12px;font-size:0.75em" 
                        onclick="NYGoals.contribute('${g.id}')">+ إضافة</button>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="empty">
            <div class="empty-icon">💰</div>
            <p>لا توجد أهداف بعد</p>
          </div>
        `}
      </div>
    `;
  },

  addGoal() {
    const title = prompt('اسم الهدف:');
    if (!title) return;
    const target = parseInt(prompt('الهدف (رقم):', '100')) || 100;
    const note = prompt('ملاحظة (اختياري):') || '';
    window.NY.socket.emit('goal-add', { title, target, note });
  },

  contribute(id) {
    const amount = parseInt(prompt('أضف كم؟', '10')) || 0;
    if (amount <= 0) return;
    window.NY.socket.emit('goal-contribute', { id, amount });
  }
};

if (window.NY && window.NY.socket) {
  window.NY.socket.on('goals-updated', goals => {
    if (!window.NY.S.room) return;
    window.NY.S.room.goals = goals;
    if (document.getElementById('fullScreenPage')) {
      const page = document.getElementById('fullScreenPage');
      const title = page.querySelector('b')?.textContent || '';
      if (title.includes('حصالة')) {
        page.querySelector('div:last-child').innerHTML = window.NYGoals.render();
      }
    }
  });
}

console.log('✅ NY Goals loaded');