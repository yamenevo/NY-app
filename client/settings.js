window.NYSettings = {
  data: {
    name: '',
    avatar: '💎',
    avatarImage: null,
    status: 'أحبك',
    theme: 'gold',
    darkMode: true,
    animations: true,
    sounds: true,
    notifications: true,
    relationshipStart: null,
    partnerName: ''
  },

  load() {
    try {
      const saved = localStorage.getItem('ny-settings');
      if (saved) Object.assign(this.data, JSON.parse(saved));
    } catch (e) {}
    return this.data;
  },

  save() {
    localStorage.setItem('ny-settings', JSON.stringify(this.data));
    if (window.socket) {
      window.socket.emit('settings-update', this.data);
    }
  },

  get(key) { return this.data[key]; },

  set(key, value) {
    this.data[key] = value;
    this.save();
    this.apply();
  },

  apply() {
    if (this.data.theme && window.NYApplyTheme) {
      window.NYApplyTheme(this.data.theme);
    }
    if (this.data.animations === false) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
    document.body.classList.toggle('light-mode', !this.data.darkMode);
  },

  avatars: [
    '💎', '💕', '🌹', '👑', '🌙', '⭐', '🦋', '🌸',
    '🎀', '💖', '✨', '🕊️', '🌟', '🥰', '😍', '💝'
  ]
};