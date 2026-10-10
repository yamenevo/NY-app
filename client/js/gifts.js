// ============ NY Gifts Shop ============
window.NYGifts = {
  catalog: [
    { emoji: '🌹', name: 'وردة', price: 10 },
    { emoji: '☕', name: 'قهوة', price: 15 },
    { emoji: '🍫', name: 'شوكولاتة', price: 20 },
    { emoji: '🧸', name: 'دبدوب', price: 30 },
    { emoji: '🍕', name: 'بيتزا', price: 40 },
    { emoji: '🍰', name: 'كيكة', price: 50 },
    { emoji: '💐', name: 'باقة ورد', price: 70 },
    { emoji: '🎁', name: 'هدية', price: 100 },
    { emoji: '💍', name: 'خاتم', price: 200 },
    { emoji: '👑', name: 'تاج', price: 500 },
    { emoji: '🏰', name: 'قصر', price: 1000 },
    { emoji: '💎', name: 'ألماسة', price: 2000 }
  ],

  render() {
    const points = this.getPoints();

    return `
      <div class="gifts-container">
        <div class="card" style="padding:20px;text-align:center;margin-bottom:16px">
          <div style="font-size:0.85em;color:var(--mut);letter-spacing:2px">
            نقاطك الحالية
          </div>
          <div style="font-size:2.5em;color:var(--rg);font-family:'Reem Kufi',serif;font-weight:700;margin:8px 0">
            ${points}
          </div>
          <div style="font-size:0.75em;color:var(--mut)">
            اكسب نقاطاً من الاستخدام اليومي
          </div>
        </div>

        <h3 style="color:var(--rg);font-size:1em;margin-bottom:12px">🛒 المتجر</h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${this.catalog.map(g => `
            <button class="gift-item" 
                    onclick="NYGifts.buy('${g.emoji}', '${g.name}', ${g.price})"
                    style="padding:14px 8px;text-align:center;${points >= g.price ? '' : 'opacity:0.4'}">
              <div style="font-size:2em">${g.emoji}</div>
              <div style="font-size:0.75em;color:var(--rgl);font-weight:600;margin-top:4px">${g.name}</div>
              <div style="font-size:0.7em;color:var(--rg);margin-top:2px">${g.price} 💎</div>
            </button>
          `).join('')}
        </div>

        <h3 style="color:var(--rg);font-size:1em;margin:20px 0 12px">🎁 الهدايا المُرسلة</h3>
        <div id="sentGifts">
          ${(window.NY.S.room?.gifts || []).length ? (window.NY.S.room.gifts).map(g => `
            <div class="card2" style="padding:12px;margin-bottom:8px">
              <div style="font-size:1.8em">${g.emoji}</div>
              <div style="color:var(--rgl);font-size:0.85em;margin-top:6px">${window.NY.esc(g.name)}</div>
              <div style="color:var(--mut);font-size:0.75em;margin-top:4px">
                من ${window.NY.esc(g.from)} — ${window.NY.when(g.time)}
              </div>
            </div>
          `).join('') : '<div class="empty" style="padding:20px">لا توجد هدايا بعد</div>'}
        </div>
      </div>
    `;
  },

  getPoints() {
    return window.NY.S.room?.points?.[window.NY.S.name] || 0;
  },

  buy(emoji, name, price) {
    const points = this.getPoints();
    if (points < price) return window.NY.toast('❌ نقاطك غير كافية');
    if (!confirm(`إرسال ${name} ${emoji} مقابل ${price} نقطة؟`)) return;

    window.NY.socket.emit('gift-send', { emoji, name, price });
    window.NY.toast('🎁 تم الإرسال');
  }
};

if (window.NY && window.NY.socket) {
  window.NY.socket.on('gifts-updated', ({ gifts, points }) => {
    if (!window.NY.S.room) return;
    window.NY.S.room.gifts = gifts;
    window.NY.S.room.points = points;
    if (window.NY.lastSub === 'gifts') window.NY.openSubPage('gifts');
  });
}

console.log('✅ NY Gifts loaded');