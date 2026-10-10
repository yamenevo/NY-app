window.NYContent = {
  custom: {
    activities: [],
    questions: [],
    challenges: [],
    love: [],
    poems: []
  },

  updateFromServer(data) {
    if (!data) return;
    this.custom = { ...this.custom, ...data };
  },

  // يحصل على قائمة كاملة (افتراضية + مخصصة)
  getAll(type) {
    const defaults = {
      activities: window.LoveData?.activities || [],
      questions: window.LoveData?.questions || [],
      challenges: window.LoveData?.challenges || [],
      love: window.LoveData?.loveMessages || [],
      poems: window.LoveData?.poems || []
    };

    const defaultList = defaults[type] || [];
    const customList = (this.custom[type] || []).map(x => x.text);

    return [...customList, ...defaultList];
  },

  // إضافة عنصر جديد
  add(type, text) {
    if (window.socket) {
      window.socket.emit('content-add', { type, text });
    }
  },

  // حذف عنصر مخصص
  remove(type, id) {
    if (window.socket) {
      window.socket.emit('content-delete', { type, id });
    }
  }
};