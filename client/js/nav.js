// ============ NY Navbar ============
window.NYNav = {
  tabs: [
    { id: 'home', icon: '🏠', label: 'الرئيسية' },
    { id: 'chat', icon: '💬', label: 'الدردشة' },
    { id: 'add', icon: '➕', label: 'إضافة', isAdd: true },
    { id: 'memories', icon: '❤️', label: 'ذكرياتنا' },
    { id: 'games', icon: '🎮', label: 'ألعاب' },
    { id: 'me', icon: '👤', label: 'أنا' }
  ],

  render() {
    const current = window.NY?.S?.currentTab || 'home';
    return `
      <nav class="app-navbar">
        ${this.tabs.map(t => `
          <button class="nav-item ${current === t.id ? 'active' : ''} ${t.isAdd ? 'add-btn' : ''}"
                  data-tab="${t.id}"
                  onclick="NYNav.go('${t.id}')">
            <span class="nav-icon">${t.icon}</span>
            <span class="nav-label">${t.label}</span>
          </button>
        `).join('')}
      </nav>
    `;
  },

  go(tab) {
    if (window.NY?.S?.currentTab === tab) return;
    window.NY.go(tab);
  },

  attachEvents() {
    // الأحداث مربوطة عبر onclick، لا نحتاج شيئاً
  }
};

console.log('✅ NY Navbar loaded');