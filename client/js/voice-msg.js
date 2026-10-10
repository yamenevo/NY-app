// ============ NY Voice Messages ============
window.NYVoiceMsg = {
  recorder: null,
  chunks: [],
  startTime: 0,
  timer: null,
  isRecording: false,

  render() {
    return `
      <div style="text-align:center;padding:20px">
        <button class="record-btn ${this.isRecording ? 'recording' : ''}" 
                onclick="NYVoiceMsg.toggle()">
          ${this.isRecording ? '⏹️' : '🎤'}
        </button>
        <div id="voiceTimer" style="font-size:1.5em;color:var(--rg);margin:12px 0">
          ${this.isRecording ? '00:00' : 'اضغط للتسجيل'}
        </div>
        <div style="color:var(--mut);font-size:0.8em;margin-top:8px">
          سجّل رسالة صوتية تصل كإشعار
        </div>
      </div>
    `;
  },

  async toggle() {
    if (this.isRecording) this.stop();
    else await this.start();
  },

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recorder = new MediaRecorder(stream);
      this.chunks = [];
      this.startTime = Date.now();

      this.recorder.ondataavailable = e => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const duration = Math.round((Date.now() - this.startTime) / 1000);
          window.NY.socket.emit('voice-send', { audio: reader.result, duration });
          window.NY.toast('🎤 تم الإرسال');
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      this.recorder.start();
      this.isRecording = true;
      this.updateUI();

      this.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const el = document.getElementById('voiceTimer');
        if (el) {
          const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
          const s = String(elapsed % 60).padStart(2, '0');
          el.textContent = `${m}:${s}`;
        }
      }, 500);
    } catch (e) {
      window.NY.toast('❌ لا يمكن الوصول للمايكروفون');
    }
  },

  stop() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    clearInterval(this.timer);
    this.isRecording = false;
    this.updateUI();
  },

  updateUI() {
    if (window.NY.S.currentTab === 'add') window.NY.renderTab('add');
  }
};

if (window.NY && window.NY.socket) {
  window.NY.socket.on('voice-received', ({ audio, duration, from }) => {
    window.NY.playNotificationSound();
    const o = document.createElement('div');
    o.className = 'ov';
    o.innerHTML = `<div class="card modal-anim">
      <div style="font-size:2em;margin-bottom:8px">🎤</div>
      <div style="color:var(--rgl);font-weight:700">رسالة صوتية من ${window.NY.esc(from)}</div>
      <div style="font-size:0.8em;color:var(--mut);margin:6px 0">${duration} ثانية</div>
      <audio controls src="${audio}" style="width:100%;margin-top:12px"></audio>
      <br>
      <button class="btn2" style="width:auto;padding:8px 16px;margin-top:12px" 
              onclick="this.closest('.ov').remove()">✕ إغلاق</button>
    </div>`;
    document.body.append(o);
  });
}

console.log('✅ NY VoiceMsg loaded');