window.NYProfile = {
  data: {
    avatar: '💎',
    avatarImage: null,
    status: 'أحبك',
    theme: 'gold'
  },

  load() {
    try {
      const saved = localStorage.getItem('ny-profile');
      if (saved) Object.assign(this.data, JSON.parse(saved));
    } catch (e) {}
  },

  save() {
    localStorage.setItem('ny-profile', JSON.stringify(this.data));
    if (window.socket) {
      window.socket.emit('profile-update', this.data);
    }
  },

  set(key, value) {
    this.data[key] = value;
    this.save();
  },

  get(key) {
    return this.data[key];
  }
};

window.NYProfile.load();