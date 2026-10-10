// ============ NY Streak — سلسلة الأيام ============
window.NYStreak = {
  render() {
    const streak = window.NY.S.room?.streak || { count: 0, lastDate: null };
    const count = streak.count || 0;
    const lastDate = streak.lastDate;
    const today = new Date().toDateString();
    const canCheckIn = lastDate !== today;
    const bothChecked = streak.todayUsers?.length >= 2;

    const achievements = this.getAchievements(count);

    return `
      <div class="streak-container" style="text-align:center">
        <div class="card" style="padding:30px;margin-bottom:16px;background:linear-gradient(135deg,var(--wine),#d4a574)">
          <div style="font-size:4em;margin-bottom:8px">🔥</div>
          <div style="font-size:3em;color:white;font-weight:700;font-family:'Reem Kufi',serif">
            ${count}
          </div>
          <div style="color:var(--rgl);font-size:0.9em;letter-spacing:2px">
            ${count === 1 ? 'يوم' : 'أيام'} متواصلة
          </div>
        </div>

        ${canCheckIn ? `
          <button class="btn" onclick="NYStreak.checkIn()" style="font-size:1.1em;padding:18px">
            ✅ سجّل حضورك اليوم
          </button>
        ` : `
          <div class="card2" style="text-align:center;padding:16px">
            <div style="color:var(--rg);font-weight:600">
              ${bothChecked ? '🎉 كلاكما سجّلتما اليوم!' : '⏳ في انتظار الطرف الآخر...'}
            </div>
          </div>
        `}

        <div style="margin-top:20px">
          <h3 style="color:var(--rg);font-size:1em;margin-bottom:12px">🏆 الإنجازات</h3>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
            ${achievements.map(a => `
              <div class="card2" style="text-align:center;padding:12px;${a.unlocked ? '' : 'opacity:0.4'}">
                <div style="font-size:2em">${a.icon}</div>
                <div style="font-size:0.75em;color:var(--rgl);margin-top:6px;font-weight:600">${a.name}</div>
                <div style="font-size:0.65em;color:var(--mut);margin-top:2px">${a.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  getAchievements(count) {
    return [
      { icon: '🌟', name: 'البداية', desc: '3 أيام', unlocked: count >= 3 },
      { icon: '💫', name: 'أسبوع', desc: '7 أيام', unlocked: count >= 7 },
      { icon: '💎', name: 'نصف شهر', desc: '15 يوم', unlocked: count >= 15 },
      { icon: '👑', name: 'شهر كامل', desc: '30 يوم', unlocked: count >= 30 },
      { icon: '🔥', name: 'مثابر', desc: '60 يوم', unlocked: count >= 60 },
      { icon: '💕', name: 'أسطورة', desc: '100 يوم', unlocked: count >= 100 }
    ];
  },

  checkIn() {
    window.NY.socket.emit('streak-checkin', {});
    window.NY.toast('🔥 تم التسجيل!');
  }
};

if (window.NY && window.NY.socket) {
  window.NY.socket.on('streak-updated', data => {
    if (!window.NY.S.room) return;
    window.NY.S.room.streak = data;
    if (window.NY.S.currentTab === 'home') window.NY.renderTab('home');
    if (window.NY.lastSub === 'streak') window.NY.openSubPage('streak');
  });
}

console.log('✅ NY Streak loaded');