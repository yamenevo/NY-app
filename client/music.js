// ============ NY YouTube Music Player v2 ============
window.NYMusic = {
  player: null,
  ready: false,
  playing: false,
  playlist: [],
  currentIndex: 0,
  volume: 50,
  apiLoaded: false,
  apiReady: false,
  pendingPlay: false,

  defaultPlaylist: [
    { id: 'kJQP7kiw5Fk', name: '🎵 Despacito' },
    { id: 'JGwWNGJdvx8', name: '🎵 Shape of You' },
    { id: 'RgKAFK5djSk', name: '🎵 See You Again' }
  ],

  init() {
    if (this.apiLoaded) return;
    this.apiLoaded = true;
    this.loadPlaylist();

    // تحميل API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    } else if (window.YT && window.YT.Player) {
      this.apiReady = true;
      setTimeout(() => this.createPlayer(), 100);
    }

    // إنشاء الحاوية
    if (!document.getElementById('ytPlayerContainer')) {
      const c = document.createElement('div');
      c.id = 'ytPlayerContainer';
      c.style.cssText = 'position:fixed;bottom:-300px;left:-300px;width:1px;height:1px;opacity:0;pointer-events:none';
      c.innerHTML = '<div id="ytPlayer"></div>';
      document.body.appendChild(c);
    }
  },

  createPlayer() {
    if (this.player || !this.playlist[this.currentIndex]) return;
    const self = this;
    const videoId = this.playlist[this.currentIndex].id;

    this.player = new YT.Player('ytPlayer', {
      height: '1',
      width: '1',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin
      },
      events: {
        onReady: (e) => {
          self.ready = true;
          e.target.setVolume(self.volume);
          self.updateUI();
          if (self.pendingPlay) {
            self.pendingPlay = false;
            e.target.playVideo();
          }
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.ENDED) self.next();
          else if (e.data === YT.PlayerState.PLAYING) {
            self.playing = true;
            self.updateUI();
          } else if (e.data === YT.PlayerState.PAUSED) {
            self.playing = false;
            self.updateUI();
          } else if (e.data === YT.PlayerState.BUFFERING) {
            self.updateUI();
          }
        },
        onError: (e) => {
          console.log('YouTube error code:', e.data);
          setTimeout(() => self.next(), 1500);
        }
      }
    });
  },

  onYouTubeIframeAPIReady() {
    this.apiReady = true;
    this.createPlayer();
  },

  loadPlaylist() {
    try {
      const saved = localStorage.getItem('ny-music-playlist');
      this.playlist = saved ? JSON.parse(saved) : [...this.defaultPlaylist];
    } catch (e) {
      this.playlist = [...this.defaultPlaylist];
    }
    const v = localStorage.getItem('ny-music-vol');
    if (v !== null) this.volume = parseInt(v);
    const i = localStorage.getItem('ny-music-idx');
    if (i !== null) this.currentIndex = parseInt(i);
    if (this.currentIndex >= this.playlist.length) this.currentIndex = 0;
  },

  savePlaylist() {
    localStorage.setItem('ny-music-playlist', JSON.stringify(this.playlist));
    localStorage.setItem('ny-music-vol', this.volume);
    localStorage.setItem('ny-music-idx', this.currentIndex);
  },

  toggle() {
    if (!this.apiLoaded) this.init();

    // إذا لم يجهز المشغل بعد
    if (!this.ready) {
      this.pendingPlay = true;
      if (window.toast) window.toast('⏳ جاري تحميل المشغل...');
      return;
    }

    if (this.playing) this.pause();
    else this.play();
  },

  play() {
    if (!this.player || !this.ready) {
      this.pendingPlay = true;
      return;
    }
    try {
      this.player.playVideo();
    } catch (e) {
      console.log('Play error:', e);
    }
  },

  pause() {
    if (this.player && this.ready) {
      this.player.pauseVideo();
    }
  },

  next() {
    if (!this.playlist.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.savePlaylist();
    if (this.player && this.ready) {
      this.player.loadVideoById(this.playlist[this.currentIndex].id);
    }
    this.updateUI();
    this.updatePlaylistUI();
  },

  prev() {
    if (!this.playlist.length) return;
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.savePlaylist();
    if (this.player && this.ready) {
      this.player.loadVideoById(this.playlist[this.currentIndex].id);
    }
    this.updateUI();
    this.updatePlaylistUI();
  },

  playIndex(i) {
    if (i < 0 || i >= this.playlist.length) return;
    this.currentIndex = i;
    this.savePlaylist();
    if (this.player && this.ready) {
      this.player.loadVideoById(this.playlist[i].id);
    }
    this.updateUI();
    this.updatePlaylistUI();
  },

  setVolume(v) {
    this.volume = parseInt(v);
    if (this.player && this.ready) this.player.setVolume(this.volume);
    this.savePlaylist();
  },

  addFromUrl(url) {
    const videoId = this.extractYouTubeId(url);
    if (!videoId) return { error: 'رابط يوتيوب غير صالح' };

    const item = { id: videoId, name: '🎵 جاري التحميل...' };
    this.playlist.push(item);
    this.savePlaylist();

    fetch('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + videoId + '&format=json')
      .then(r => r.json())
      .then(data => {
        if (data && data.title) {
          item.name = '🎵 ' + data.title;
          this.savePlaylist();
          this.updatePlaylistUI();
        }
      })
      .catch(() => { item.name = '🎵 فيديو يوتيوب'; });

    return { success: true, item };
  },

  extractYouTubeId(url) {
    if (!url) return null;
    const c = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(c)) return c;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    for (const p of patterns) {
      const m = c.match(p);
      if (m && m[1]) return m[1];
    }
    return null;
  },

  removeFromPlaylist(i) {
    if (i < 0 || i >= this.playlist.length) return;
    this.playlist.splice(i, 1);
    if (this.currentIndex >= this.playlist.length) this.currentIndex = 0;
    this.savePlaylist();
    this.updatePlaylistUI();
    this.updateUI();
  },

  currentName() {
    if (!this.playlist.length) return 'لا توجد أغاني';
    return this.playlist[this.currentIndex]?.name || 'غير معروف';
  },

  updateUI() {
    const btn = document.getElementById('musicPlayBtn');
    const name = document.getElementById('musicName');
    const curName = document.getElementById('currentMusicName');
    if (btn) btn.textContent = this.playing ? '⏸️' : '▶️';
    if (name) name.textContent = this.currentName();
    if (curName) curName.textContent = this.currentName();
  },

  updatePlaylistUI() {
    const list = document.getElementById('musicPlaylist');
    if (!list) return;
    const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    list.innerHTML = `
      <div style="margin-bottom:12px">
        <input type="text" id="ytUrlInput" 
               placeholder="الصق رابط يوتيوب هنا..." 
               style="margin-bottom:6px">
        <button class="btn" onclick="NYMusic.handleAddUrl()">
          ➕ إضافة للقائمة
        </button>
      </div>
      <div style="max-height:400px;overflow-y:auto">
        ${this.playlist.length ? this.playlist.map((item, i) => `
          <div class="content-item">
            <span onclick="NYMusic.playIndex(${i})" style="flex:1;cursor:pointer">
              ${i === this.currentIndex ? '▶️ ' : ''}${e(item.name)}
            </span>
            <span class="del" onclick="NYMusic.removeFromPlaylist(${i})">🗑️</span>
          </div>
        `).join('') : '<div class="empty" style="padding:20px">القائمة فارغة</div>'}
      </div>
    `;
  },

  handleAddUrl() {
    const input = document.getElementById('ytUrlInput');
    if (!input) return;
    const url = input.value.trim();
    if (!url) return;
    const result = this.addFromUrl(url);
    if (result.error) {
      alert(result.error);
      return;
    }
    input.value = '';
    this.updatePlaylistUI();
    if (window.toast) window.toast('✅ تمت الإضافة');
  }
};

window.onYouTubeIframeAPIReady = function() {
  console.log('✅ YouTube API ready');
  window.NYMusic.onYouTubeIframeAPIReady();
};

// تحميل API مبكراً
setTimeout(() => window.NYMusic.init(), 500);