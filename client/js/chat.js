// ============ NY Chat ============
window.NYChat = {
  render() {
    const chat = window.NY?.S?.room?.chat || [];
    const myName = window.NY?.S?.name;

    return `
      <div class="chat-container" style="display:flex;flex-direction:column;height:calc(100vh - 130px)">
        <div class="chat-messages" id="chatMessages" 
             style="flex:1;overflow-y:auto;padding:8px 4px;display:flex;flex-direction:column;gap:6px">
          ${chat.length ? chat.map(m => this.renderMessage(m, myName)).join('') : `
            <div class="empty">
              <div class="empty-icon">💬</div>
              <p>لا توجد رسائل بعد.<br>ابدأ الحديث!</p>
            </div>
          `}
        </div>

        <div class="chat-input-bar" 
             style="display:flex;gap:6px;padding:8px;background:rgba(20,20,28,0.95);border-radius:16px;margin-top:6px;align-items:center">
          <button class="chat-action-btn" onclick="NYChat.pickImage()" title="صورة">📷</button>
          <button class="chat-action-btn" onclick="NYChat.pickVoice()" title="صوت">🎤</button>
          <input type="text" id="chatInput" placeholder="اكتب رسالة..." 
                 style="flex:1;margin:0;padding:10px 14px;border-radius:20px;font-size:0.9em"
                 oninput="NYChat.onTyping()"
                 onkeypress="if(event.key==='Enter')NYChat.send()">
          <button class="chat-send-btn" onclick="NYChat.send()">📤</button>
        </div>

        <input type="file" id="chatImageInput" accept="image/*" style="display:none" onchange="NYChat.handleImage(event)">
        <div id="chatVoiceArea" style="display:none;padding:8px;background:rgba(20,20,28,0.95);border-radius:16px;margin-top:6px;text-align:center">
          <div style="color:var(--rg);font-weight:700;margin-bottom:8px">🎤 جاري التسجيل...</div>
          <div id="voiceTimer" style="font-size:1.5em;color:var(--rgl);margin:8px 0">00:00</div>
          <button class="btn" onclick="NYChat.stopRecording()" style="width:auto;padding:8px 24px">⏹️ إيقاف وإرسال</button>
          <button class="btn2" onclick="NYChat.cancelRecording()" style="width:auto;padding:8px 24px;margin-right:6px">❌ إلغاء</button>
        </div>
      </div>
    `;
  },

  renderMessage(m, myName) {
    const isMine = m.from === myName;
    const time = new Date(m.time).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
    const replyMsg = m.replyTo ? this.findMessage(m.replyTo) : null;
    
    let content = '';
    if (replyMsg) {
      content += `
        <div class="reply-preview" style="background:rgba(0,0,0,0.2);padding:6px 10px;border-radius:8px;margin-bottom:6px;border-right:3px solid var(--gold);font-size:0.8em;opacity:0.8">
          <b>${window.NY.esc(replyMsg.from)}</b><br>
          ${window.NY.esc((replyMsg.text || '').slice(0, 60))}
        </div>
      `;
    }
    if (m.text) content += `<div>${window.NY.esc(m.text)}</div>`;
    if (m.image) content += `<img src="${m.image}" style="max-width:100%;border-radius:10px;margin-top:6px" onclick="window.open(this.src)">`;
    if (m.audio) content += `<audio controls src="${m.audio}" style="max-width:100%;margin-top:6px"></audio>`;

    const status = isMine ? (m.read ? '✓✓' : '✓') : '';
    const statusColor = m.read ? '#6fbf73' : 'rgba(255,255,255,0.6)';

    return `
      <div class="chat-msg ${isMine ? 'mine' : 'theirs'}" 
           data-id="${m.id}"
           style="max-width:78%;${isMine ? 'align-self:flex-start;background:linear-gradient(135deg,var(--wine),var(--rgd))' : 'align-self:flex-end;background:rgba(232,180,160,0.12);border:1px solid rgba(212,165,116,0.2)'};padding:10px 14px;border-radius:16px;font-size:0.9em;position:relative">
        <div style="font-size:0.7em;opacity:0.75;margin-bottom:3px">${isMine ? 'أنت' : window.NY.esc(m.from)}</div>
        ${content}
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:6px;font-size:0.7em;opacity:0.7">
          <span>${time}</span>
          <div>
            ${status ? `<span style="color:${statusColor};font-weight:bold">${status}</span>` : ''}
            ${isMine ? `<button onclick="NYChat.deleteMsg('${m.id}')" style="background:none;border:0;color:inherit;cursor:pointer;margin-right:6px">🗑️</button>` : ''}
            <button onclick="NYChat.replyTo('${m.id}')" style="background:none;border:0;color:inherit;cursor:pointer">↩</button>
          </div>
        </div>
      </div>
    `;
  },

  findMessage(id) {
    return (window.NY?.S?.room?.chat || []).find(x => x.id === id);
  },

  attachEvents() {
    this.scrollToBottom();
    this.markAllRead();
  },

  scrollToBottom() {
    const el = document.getElementById('chatMessages');
    if (el) el.scrollTop = el.scrollHeight;
  },

  send() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    window.NY.socket.emit('chat-send', { 
      text, 
      replyTo: this.replyToId || null 
    });
    
    input.value = '';
    this.replyToId = null;
    window.NY.socket.emit('chat-typing', { isTyping: false });
  },

  replyToId: null,
  replyTo(id) {
    this.replyToId = id;
    window.NY.toast('↩️ تم تحديد الرسالة للرد');
  },

  deleteMsg(id) {
    if (!confirm('حذف الرسالة؟')) return;
    window.NY.socket.emit('chat-delete', { id });
  },

  pickImage() {
    document.getElementById('chatImageInput')?.click();
  },

  async handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return window.NY.toast('الصورة كبيرة (الحد 3MB)');
    
    const data = await this.shrinkImage(file);
    window.NY.socket.emit('chat-send', { image: data });
    e.target.value = '';
  },

  shrinkImage(f) {
    return new Promise(r => {
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, 1200 / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = im.width * s;
        c.height = im.height * s;
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        r(c.toDataURL('image/jpeg', 0.75));
      };
      im.src = URL.createObjectURL(f);
    });
  },

  // Voice recording
  mediaRecorder: null,
  audioChunks: [],
  voiceTimer: null,
  voiceStart: 0,

  async pickVoice() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.voiceStart = Date.now();

      this.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          window.NY.socket.emit('chat-send', { audio: reader.result });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      this.mediaRecorder.start();
      document.getElementById('chatVoiceArea').style.display = 'block';
      
      this.voiceTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.voiceStart) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        const el = document.getElementById('voiceTimer');
        if (el) el.textContent = `${m}:${s}`;
      }, 500);
    } catch (e) {
      window.NY.toast('لا يمكن الوصول للمايكروفون');
    }
  },

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    clearInterval(this.voiceTimer);
    document.getElementById('chatVoiceArea').style.display = 'none';
  },

  cancelRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }
    clearInterval(this.voiceTimer);
    document.getElementById('chatVoiceArea').style.display = 'none';
  },

  // Typing indicator
  typingTimeout: null,
  onTyping() {
    window.NY.socket.emit('chat-typing', { isTyping: true });
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      window.NY.socket.emit('chat-typing', { isTyping: false });
    }, 1500);
  },

  // Append new message
  appendMessage(msg) {
    const el = document.getElementById('chatMessages');
    if (!el) return;
    
    const empty = el.querySelector('.empty');
    if (empty) empty.remove();
    
    const myName = window.NY.S.name;
    el.insertAdjacentHTML('beforeend', this.renderMessage(msg, myName));
    this.scrollToBottom();
    this.markAllRead();
  },

  deleteMessage(id) {
    document.querySelector(`.chat-msg[data-id="${id}"]`)?.remove();
  },

  updateReadStatus({ ids, at }) {
    ids.forEach(id => {
      const el = document.querySelector(`.chat-msg[data-id="${id}"]`);
      if (el) {
        const statusEl = el.querySelector('div:last-child span');
        if (statusEl) {
          statusEl.textContent = '✓✓';
          statusEl.style.color = '#6fbf73';
        }
      }
    });
  },

  markAllRead() {
    const myName = window.NY.S.name;
    const unread = (window.NY.S.room.chat || [])
      .filter(m => m.from !== myName && !m.read)
      .map(m => m.id);
    if (unread.length) {
      window.NY.socket.emit('chat-read', { ids: unread });
    }
  }
};

// Socket listeners
if (window.NY && window.NY.socket) {
  window.NY.socket.on('chat-message', msg => {
    if (window.NY.S.room) window.NY.S.room.chat.push(msg);
    if (window.NY.S.currentTab === 'chat') {
      NYChat.appendMessage(msg);
      NYChat.markAllRead();
    } else {
      window.NY.playNotificationSound();
      window.NY.toast(`💬 ${msg.from}: ${(msg.text || '📷').slice(0, 40)}`);
    }
  });

  window.NY.socket.on('chat-deleted', id => {
    if (window.NY.S.room) {
      window.NY.S.room.chat = window.NY.S.room.chat.filter(m => m.id !== id);
    }
    NYChat.deleteMessage(id);
  });

  window.NY.socket.on('chat-read-update', data => {
    NYChat.updateReadStatus(data);
  });

  window.NY.socket.on('typing-update', typing => {
    const el = document.getElementById('typingIndicator');
    const myName = window.NY.S.name;
    const others = Object.keys(typing || {}).filter(n => n !== myName);
    if (others.length && window.NY.S.currentTab === 'chat') {
      if (!el) {
        const container = document.getElementById('chatMessages');
        if (container) {
          container.insertAdjacentHTML('afterend', `
            <div id="typingIndicator" style="padding:6px 14px;font-size:0.8em;color:var(--rg);font-style:italic">
              ✍️ ${others.join('، ')} يكتب...
            </div>
          `);
        }
      }
    } else {
      el?.remove();
    }
  });
}

console.log('✅ NY Chat loaded');