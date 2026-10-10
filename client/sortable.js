window.NYSortable = {
  storageKey: 'ny-button-order',
  editMode: false,
  dragSource: null,

  defaultOrder: [
    'diary', 'fights',
    'love', 'activity',
    'question', 'challenge',
    'honesty', 'poem',
    'ai', 'game',
    'gift', 'song',
    'bold', 'engage',
    'bite', 'about'
  ],

  allButtons: {
    diary: { icon: '📔', label: 'يومياتي', href: '#/diary' },
    fights: { icon: '💢', label: 'عاتبني', href: '#/fights' },
    love: { icon: '💌', label: 'رسالة حب', href: '#/love' },
    activity: { icon: '🎲', label: 'فعالية', href: '#/activity' },
    question: { icon: '❓', label: 'سؤال', href: '#/question' },
    challenge: { icon: '⚡', label: 'تحدي', href: '#/challenge' },
    honesty: { icon: '💬', label: 'صراحة', href: '#/honesty' },
    poem: { icon: '📜', label: 'إهداء', href: '#/poem' },
    ai: { icon: '🤖', label: 'ذكاء AI', href: '#/ai' },
    game: { icon: '🎮', label: 'لعبة', href: '#/game' },
    gift: { icon: '🎁', label: 'هدية', href: '#/gift' },
    song: { icon: '🎵', label: 'أغنية', href: '#/song' },
    bold: { icon: '🔥', label: 'جريء', href: '#/bold' },
    engage: { icon: '💍', label: 'خطوبة', href: '#/engage' },
    bite: { icon: '💋', label: 'عضّة', href: '#/bite' },
    about: { icon: '📖', label: 'قصة NY', href: '#/about' }
  },

  getOrder() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const order = JSON.parse(saved);
        const missing = this.defaultOrder.filter(k => !order.includes(k));
        return [...order, ...missing];
      }
    } catch (e) {}
    return [...this.defaultOrder];
  },

  saveOrder(order) {
    localStorage.setItem(this.storageKey, JSON.stringify(order));
  },

  renderGrid() {
    const order = this.getOrder();
    return `
      <div class="grid" id="mainGrid">
        ${order.map(key => {
          const b = this.allButtons[key];
          if (!b) return '';
          return `
            <a href="${b.href}" 
               class="fade-in sortable-item" 
               data-key="${key}">
              ${b.icon}<span>${b.label}</span>
            </a>
          `;
        }).join('')}
      </div>
    `;
  },

  toggleEditMode() {
    this.editMode = !this.editMode;
    const grid = document.getElementById('mainGrid');
    if (!grid) return;

    if (this.editMode) {
      grid.classList.add('edit-mode');
      grid.querySelectorAll('.sortable-item').forEach(item => {
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', this.handleDragStart.bind(this));
        item.addEventListener('dragover', this.handleDragOver.bind(this));
        item.addEventListener('drop', this.handleDrop.bind(this));
        item.addEventListener('dragend', this.handleDragEnd.bind(this));
      });
    } else {
      grid.classList.remove('edit-mode');
      grid.querySelectorAll('.sortable-item').forEach(item => {
        item.removeAttribute('draggable');
      });
      this.saveCurrentOrder();
    }
  },

  handleDragStart(e) {
    this.dragSource = e.target.closest('.sortable-item');
    if (!this.dragSource) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.dragSource.innerHTML);
    this.dragSource.style.opacity = '0.4';
  },

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.sortable-item');
    const source = this.dragSource;
    if (target && target !== source) {
      const grid = document.getElementById('mainGrid');
      const items = [...grid.querySelectorAll('.sortable-item')];
      const sourceIdx = items.indexOf(source);
      const targetIdx = items.indexOf(target);

      if (sourceIdx < targetIdx) {
        target.after(source);
      } else {
        target.before(source);
      }
    }
  },

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
  },

  handleDragEnd(e) {
    const source = e.target.closest('.sortable-item');
    if (source) source.style.opacity = '1';
  },

  saveCurrentOrder() {
    const grid = document.getElementById('mainGrid');
    if (!grid) return;
    const order = [...grid.querySelectorAll('.sortable-item')].map(
      item => item.dataset.key
    );
    this.saveOrder(order);
  }
};