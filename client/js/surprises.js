// ============ NY Surprises Box ============
window.NYSurprises = {
  surprises: [
    { emoji: '💕', text: 'أنت أجمل ما في حياتي' },
    { emoji: '🌹', text: 'وردة لك اليوم، تذكّرتك' },
    { emoji: '💌', text: 'رسالة صغيرة: أحبك' },
    { emoji: '🎁', text: 'هدية مجانية: ابتسامة مني لك' },
    { emoji: '🌟', text: 'تذكّر: أنت رائع' },
    { emoji: '🥰', text: 'نكتة اليوم: أنتِ الأجمل حتى وأنتِ زعلانة' },
    { emoji: '💎', text: 'ذكرى: أول مرة كلمتك' },
    { emoji: '✨', text: 'تحدي اليوم: أرسل 3 قلوب حب' },
    { emoji: '🎵', text: 'أغنية اليوم: شغّل أغنية تحبها' },
    { emoji: '☕', text: 'دعوة: خذ استراحة وحب نفسك' },
    { emoji: '🌈', text: 'نصيحة: الضحكة أفضل دواء' },
    { emoji: '💫', text: 'وعد: سأكون معك دائماً' }
  ],

  render() {
    return `
      <div style="text-align:center;padding:20px">
        <div class="card" style="padding:30px;margin-bottom:16px">
          <div style="font-size:3em;margin-bottom:12px">🎁</div>
          <div style="color:var(--rgl);font-weight:700;font-size:1.1em">
            صندوق مفاجآت
          </div>
          <div style="color:var(--mut);font-size:0.85em;margin-top:8px">
            افتح صندوقاً كل يوم لتحصل على مفاجأة
          </div>
        </div>

        <button class="btn" onclick="NYSurprises.open()" style="font-size:1.1em;padding:18px">
          🎁 افتح الصندوق
        </button>

        <div id="surpriseResult" style="margin-top:20px"></div>
      </div>
    `;
  },

  open() {
    const lastOpen = localStorage.getItem('last-surprise');
    const today = new Date().toDateString();
    
    if (lastOpen === today) {
      return window.NY.toast('⏰ عد غداً لمفاجأة جديدة!');
    }

    const idx = Math.floor(Math.random() * this.surprises.length);
    const s = this.surprises[idx];
    
    localStorage.setItem('last-surprise', today);

    const result = document.getElementById('surpriseResult');
    if (result) {
      result.innerHTML = `
        <div class="card" style="animation: bounceIn 0.6s">
          <div style="font-size:3em;margin-bottom:12px">${s.emoji}</div>
          <div style="line-height:1.8;font-size:1.05em">${s.text}</div>
        </div>
      `;
    }
    window.NY.playNotificationSound();
  }
};

console.log('✅ NY Surprises loaded');