// ============ NY Seasonal Themes ============
window.NYSeasonalThemes = {
  themes: {
    ramadan: {
      name: '🌙 رمضان',
      months: [3, 4],
      primary: '#d4a574',
      secondary: '#8b6f47',
      bg: '#0a0a0f',
      accent: '#f4c9b8'
    },
    eid: {
      name: '🎉 عيد',
      months: [4, 5, 6],
      primary: '#ffd700',
      secondary: '#8b2e4a',
      bg: '#0f0a14',
      accent: '#fff3b0'
    },
    love: {
      name: '💕 عيد الحب',
      months: [1, 2],
      primary: '#ff1744',
      secondary: '#8b2e4a',
      bg: '#1a0a14',
      accent: '#ffb3d1'
    },
    winter: {
      name: '❄️ شتاء',
      months: [11, 12],
      primary: '#90caf9',
      secondary: '#1565c0',
      bg: '#0a0f1a',
      accent: '#e3f2fd'
    }
  },

  getCurrent() {
    const month = new Date().getMonth() + 1;
    for (const [key, theme] of Object.entries(this.themes)) {
      if (theme.months.includes(month)) {
        return { key, ...theme };
      }
    }
    return null;
  },

  apply() {
    const theme = this.getCurrent();
    if (!theme) return;
    
    const root = document.documentElement;
    root.style.setProperty('--rg', theme.primary);
    root.style.setProperty('--rgd', theme.secondary);
    root.style.setProperty('--rgl', theme.accent);
    root.style.setProperty('--bk', theme.bg);
    
    console.log('🎨 Seasonal theme:', theme.name);
  },

  reset() {
    const root = document.documentElement;
    root.style.setProperty('--rg', '#e8b4a0');
    root.style.setProperty('--rgd', '#c99380');
    root.style.setProperty('--rgl', '#f4c9b8');
    root.style.setProperty('--bk', '#0a0a0f');
  },

  render() {
    const current = this.getCurrent();
    return `
      <div style="padding:12px">
        <div class="card" style="padding:20px;text-align:center;margin-bottom:16px">
          <div style="font-size:2em;margin-bottom:8px">🎨</div>
          <div style="color:var(--rg);font-weight:700">
            ${current ? current.name : 'ثيم افتراضي'}
          </div>
          <div style="color:var(--mut);font-size:0.8em;margin-top:6px">
            ${current ? 'مطبّق تلقائياً حسب الموسم' : 'لا يوجد ثيم موسمي حالياً'}
          </div>
        </div>

        <h3 style="color:var(--rg);font-size:0.95em;margin-bottom:12px">اختر ثيماً يدوياً:</h3>
        ${Object.entries(this.themes).map(([key, t]) => `
          <button class="btn2" style="text-align:right;padding:14px;margin-bottom:8px" 
                  onclick="NYSeasonalThemes.applyManual('${key}')">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="font-size:1.8em">${t.name.split(' ')[0]}</div>
              <div style="flex:1">
                <div style="color:var(--rgl);font-weight:600">${t.name.split(' ').slice(1).join(' ')}</div>
                <div style="display:flex;gap:4px;margin-top:6px">
                  <span style="width:16px;height:16px;border-radius:50%;background:${t.primary};border:1px solid rgba(255,255,255,0.2)"></span>
                  <span style="width:16px;height:16px;border-radius:50%;background:${t.secondary};border:1px solid rgba(255,255,255,0.2)"></span>
                  <span style="width:16px;height:16px;border-radius:50%;background:${t.accent};border:1px solid rgba(255,255,255,0.2)"></span>
                </div>
              </div>
            </div>
          </button>
        `).join('')}

        <button class="btn" style="margin-top:16px" onclick="NYSeasonalThemes.reset()">
          🔄 إعادة افتراضي
        </button>
      </div>
    `;
  },

  applyManual(key) {
    const t = this.themes[key];
    if (!t) return;
    const root = document.documentElement;
    root.style.setProperty('--rg', t.primary);
    root.style.setProperty('--rgd', t.secondary);
    root.style.setProperty('--rgl', t.accent);
    root.style.setProperty('--bk', t.bg);
    window.NY.toast('🎨 ' + t.name);
  }
};

// تطبيق تلقائي عند التحميل (اختياري)
// NYSeasonalThemes.apply();

console.log('✅ NY Seasonal Themes loaded');