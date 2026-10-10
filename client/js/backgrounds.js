// ============ NY Animated Backgrounds ============
window.NYBackgrounds = {
  current: 'hearts',
  interval: null,

  types: ['hearts', 'stars', 'bubbles', 'none'],

  start() {
    this.stop();
    const saved = localStorage.getItem('ny-bg') || 'hearts';
    this.current = saved;
    if (saved !== 'none') {
      this.interval = setInterval(() => this.spawn(), 3000);
    }
  },

  stop() {
    if (this.interval) clearInterval(this.interval);
    document.querySelectorAll('.ny-bg-particle').forEach(el => el.remove());
  },

  set(type) {
    this.current = type;
    localStorage.setItem('ny-bg', type);
    this.stop();
    this.start();
    window.NY.toast('🎨 تم التغيير');
  },

  spawn() {
    if (this.current === 'none') return;
    
    const types = {
      hearts: ['💎', '❤️', '💕', '💖'],
      stars: ['⭐', '✨', '🌟', '💫'],
      bubbles: ['○', '◯', '◉', '○']
    };
    
    const icons = types[this.current] || types.hearts;
    const el = document.createElement('div');
    el.className = 'ny-bg-particle';
    el.textContent = icons[Math.floor(Math.random() * icons.length)];
    el.style.cssText = `
      position: fixed;
      top: -50px;
      left: ${Math.random() * 100}vw;
      font-size: ${Math.random() * 15 + 15}px;
      opacity: ${Math.random() * 0.4 + 0.2};
      animation: ny-bg-fall ${Math.random() * 4 + 6}s linear forwards;
      pointer-events: none;
      z-index: 0;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 10000);
  },

  render() {
    return `
      <div style="padding:12px">
        <div class="card" style="padding:20px;text-align:center;margin-bottom:16px">
          <div style="font-size:2em;margin-bottom:8px">✨</div>
          <div style="color:var(--rg);font-weight:700">الخلفيات المتحركة</div>
        </div>

        ${this.types.map(t => {
          const labels = {
            hearts: '💎 قلوب وألماس',
            stars: '⭐ نجوم',
            bubbles: '○ فقاعات',
            none: '❌ بلا خلفية'
          };
          return `
            <button class="btn2" style="text-align:right;padding:14px;margin-bottom:8px;${this.current === t ? 'border-color:var(--rg);background:rgba(232,180,160,0.15)' : ''}" 
                    onclick="NYBackgrounds.set('${t}')">
              <div style="color:var(--rgl);font-weight:600">${labels[t]}</div>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }
};

// CSS للأنيميشن
if (!document.getElementById('ny-bg-style')) {
  const style = document.createElement('style');
  style.id = 'ny-bg-style';
  style.textContent = `
    @keyframes ny-bg-fall {
      to { transform: translateY(110vh) rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

console.log('✅ NY Backgrounds loaded');