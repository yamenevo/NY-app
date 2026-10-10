// ============ NY Sub-Tabs Manager ============
window.NYSubTabs = {
  current: {
    chat: 'messages',
    memories: 'photos',
    games: 'games'
  },

  set(tab, sub) {
    this.current[tab] = sub;
    window.NY.renderTab(tab);
  }
};

console.log('✅ NY SubTabs loaded');