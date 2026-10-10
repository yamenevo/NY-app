// ============ NY Daily Challenge ============
window.NYDaily = {
  render() {
    const daily = window.NY.S.room?.daily || {};
    const today = new Date().toDateString();
    const todayChallenge = daily[today];
    const answers = todayChallenge?.answers || {};
    const myName = window.NY.S.name;
    const myAnswer = answers[myName];
    const partnerAnswer = Object.entries(answers).find(([k]) => k !== myName);

    const question = todayChallenge?.question || this.pickQuestion();

    return `
      <div class="daily-container">
        <div class="card" style="padding:24px;margin-bottom:16px">
          <div style="font-size:2.5em;margin-bottom:12px">🎯</div>
          <div style="color:var(--rgl);font-size:0.8em;letter-spacing:2px;margin-bottom:8px">
            تحدي اليوم
          </div>
          <div style="font-size:1.1em;line-height:1.7;margin:12px 0">
            ${window.NY.esc(question)}
          </div>
        </div>

        ${!myAnswer ? `
          <textarea id="dailyAnswer" rows="4" placeholder="اكتب إجابتك..." style="margin-bottom:12px"></textarea>
          <button class="btn" onclick="NYDaily.submit()">📤 إرسال الإجابة</button>
        ` : `
          <div class="card2" style="padding:14px;margin-bottom:12px">
            <div style="color:var(--rg);font-size:0.8em;margin-bottom:6px">إجابتك:</div>
            <div style="line-height:1.6">${window.NY.esc(myAnswer)}</div>
          </div>
          ${partnerAnswer ? `
            <div class="card2" style="padding:14px;border-color:var(--rg)">
              <div style="color:var(--rgl);font-size:0.8em;margin-bottom:6px">إجابة ${window.NY.esc(partnerAnswer[0])}:</div>
              <div style="line-height:1.6">${window.NY.esc(partnerAnswer[1])}</div>
            </div>
          ` : `
            <div class="card2" style="text-align:center;padding:14px">
              <div style="color:var(--mut);font-size:0.85em">
                ⏳ في انتظار إجابة الطرف الآخر...
              </div>
            </div>
          `}
        `}
      </div>
    `;
  },

  pickQuestion() {
    const questions = window.LoveData?.questions || ['ما أجمل ذكرى بيننا؟'];
    // استخدم التاريخ كبذرة للثبات
    const seed = new Date().getDate();
    return questions[seed % questions.length];
  },

  submit() {
    const text = document.getElementById('dailyAnswer')?.value.trim();
    if (!text) return window.NY.toast('اكتب إجابتك');

    const today = new Date().toDateString();
    window.NY.socket.emit('daily-submit', {
      date: today,
      question: this.pickQuestion(),
      answer: text
    });
    window.NY.toast('✅ تم الإرسال');
  }
};

if (window.NY && window.NY.socket) {
  window.NY.socket.on('daily-updated', data => {
    if (!window.NY.S.room) return;
    window.NY.S.room.daily = data;
    if (window.NY.lastSub === 'daily') window.NY.openSubPage('daily');
    if (window.NY.S.currentTab === 'home') window.NY.renderTab('home');
  });
}

console.log('✅ NY Daily loaded');