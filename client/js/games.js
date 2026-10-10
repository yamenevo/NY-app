// ============ NY Games — Truth or Dare + اختبارات ============
window.NYGames = {
  currentGame: null,

  render() {
    if (this.currentGame === 'truth') return this.renderTruthOrDare();
    if (this.currentGame === 'quiz') return this.renderQuiz();
    if (this.currentGame === 'watch') return this.renderWatchTogether();

    return `
      <div class="games-container">
        <button class="btn2" onclick="NYGames.startGame('truth')" style="padding:20px;margin-bottom:10px;text-align:right">
          <div style="font-size:2em">🎲</div>
          <div style="color:var(--rg);font-weight:700;font-size:1em;margin-top:6px">Truth or Dare</div>
          <div style="color:var(--mut);font-size:0.8em;margin-top:4px">صراحة أو جرأة</div>
        </button>

        <button class="btn2" onclick="NYGames.startGame('quiz')" style="padding:20px;margin-bottom:10px;text-align:right">
          <div style="font-size:2em">🧩</div>
          <div style="color:var(--rg);font-weight:700;font-size:1em;margin-top:6px">اختبار الحب</div>
          <div style="color:var(--mut);font-size:0.8em;margin-top:4px">كم تعرف بعضكما؟</div>
        </button>

        <button class="btn2" onclick="NYGames.startGame('watch')" style="padding:20px;margin-bottom:10px;text-align:right">
          <div style="font-size:2em">🎬</div>
          <div style="color:var(--rg);font-weight:700;font-size:1em;margin-top:6px">شاهد معاً</div>
          <div style="color:var(--mut);font-size:0.8em;margin-top:4px">يوتيوب متزامن</div>
        </button>
      </div>
    `;
  },

  // ============ Truth or Dare ============
  truthOrDare: {
    truths: [
      'ما أكثر شيء تخاف أن تخسره فيّ؟',
      'هل فكرت يوماً أن تتركني؟ لماذا؟',
      'ما أكبر سر تخبئه عني؟',
      'ما الشيء الذي تكرهه فيّ ولا تقوله؟',
      'هل أنا أول حب حقيقي في حياتك؟',
      'ما أكثر شيء يخيفك في علاقتنا؟',
      'ما الشيء الذي تتمنى أن أغيره فيك؟',
      'لو عاد بك الزمن، هل ستختارني مرة أخرى؟',
      'ما أكثر شيء تحتاجه مني ولا تجده؟',
      'ما أكثر لحظة ندمت فيها في علاقتنا؟'
    ],
    dares: [
      'أرسل لي رسالة صوتية تغني فيها',
      'اكتب اسمي 20 مرة',
      'أرسل لي صورة وجهك الآن',
      'قل "أحبك" بثلاث لغات مختلفة',
      'ارسم قلبي على ورقة وأرسله',
      'اكتب قصة قصيرة عنا في 3 أسطر',
      'أخبرني عن أول انطباع لك عني',
      'اتصل بي وقل شيئاً جميلاً',
      'أرسل لي إيموجي يمثل حالتك الآن',
      'أرسل لي أغنية تعبر عن حبك لي'
    ]
  },

  renderTruthOrDare() {
    return `
      <div class="hd">
        <button onclick="NYGames.currentGame=null; NY.renderTab('games')">→</button>
        <b>🎲 Truth or Dare</b>
        <span style="width:36px"></span>
      </div>

      <div class="card" style="padding:40px 20px;text-align:center">
        <div style="font-size:3em;margin-bottom:12px">🎯</div>
        <div style="color:var(--rgl);font-size:1.1em;font-weight:600">
          اختر تحديك
        </div>
      </div>

      <div class="row2">
        <button class="btn" onclick="NYGames.truth()" style="padding:20px">
          💬 صراحة
        </button>
        <button class="btn" onclick="NYGames.dare()" style="padding:20px;background:linear-gradient(135deg,#d9534f,#8b2e4a)">
          🔥 جرأة
        </button>
      </div>

      <div id="todResult" style="margin-top:16px"></div>
    `;
  },

  truth() {
    const t = window.NY.pick(this.truthOrDare.truths);
    const el = document.getElementById('todResult');
    if (el) el.innerHTML = `
      <div class="card" style="animation:bounceIn 0.5s">
        <div style="font-size:1.5em;margin-bottom:8px">💬</div>
        <div style="color:var(--rgl);font-weight:600;margin-bottom:12px">صراحة</div>
        <div style="line-height:1.7;font-size:1em">${t}</div>
      </div>
    `;
  },

  dare() {
    const d = window.NY.pick(this.truthOrDare.dares);
    const el = document.getElementById('todResult');
    if (el) el.innerHTML = `
      <div class="card" style="animation:bounceIn 0.5s;background:linear-gradient(135deg,#8b2e4a,#d9534f)">
        <div style="font-size:1.5em;margin-bottom:8px">🔥</div>
        <div style="color:var(--rgl);font-weight:600;margin-bottom:12px">جرأة</div>
        <div style="line-height:1.7;font-size:1em">${d}</div>
      </div>
    `;
  },

  // ============ Quiz ============
  quizQuestions: [
    { q: 'ما هو لوني المفضل؟', a: '' },
    { q: 'ما هي أكلتي المفضلة؟', a: '' },
    { q: 'ما هو أول شيء فعلناه معاً؟', a: '' },
    { q: 'متى عيد ميلادي؟', a: '' },
    { q: 'ما هي هوايتي؟', a: '' },
    { q: 'ما أكثر شيء أخاف منه؟', a: '' },
    { q: 'ما اسم مدينتي؟', a: '' },
    { q: 'ما هو لون عيوني؟', a: '' },
    { q: 'ما أول رسالة أرسلتها لك؟', a: '' },
    { q: 'ما هو حلمي في الحياة؟', a: '' }
  ],

  renderQuiz() {
    return `
      <div class="hd">
        <button onclick="NYGames.currentGame=null; NY.renderTab('games')">→</button>
        <b>🧩 اختبار الحب</b>
        <span style="width:36px"></span>
      </div>

      <div class="card" style="padding:20px;text-align:center">
        <div style="font-size:2em;margin-bottom:8px">🧩</div>
        <div style="color:var(--rgl);font-size:1em;font-weight:600">
          كم تعرفني؟
        </div>
        <div style="color:var(--mut);font-size:0.8em;margin-top:6px">
          أجب عن 10 أسئلة عني
        </div>
      </div>

      <button class="btn" onclick="NYGames.startQuiz()">🚀 ابدأ الاختبار</button>
      <div id="quizArea"></div>
    `;
  },

  quizIndex: 0,
  quizScore: 0,
  quizAnswers: {},

  startQuiz() {
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizAnswers = {};
    this.showQuizQuestion();
  },

  showQuizQuestion() {
    if (this.quizIndex >= this.quizQuestions.length) {
      return this.showQuizResult();
    }

    const q = this.quizQuestions[this.quizIndex];
    const area = document.getElementById('quizArea');
    if (!area) return;

    area.innerHTML = `
      <div class="card2" style="padding:16px;margin-top:16px">
        <div style="color:var(--mut);font-size:0.8em">
          السؤال ${this.quizIndex + 1} / ${this.quizQuestions.length}
        </div>
        <div style="color:var(--rgl);font-weight:600;font-size:1em;margin:8px 0">
          ${q.q}
        </div>
        <input id="quizAnswer" placeholder="اكتب إجابتك...">
        <button class="btn" style="margin-top:8px" onclick="NYGames.submitAnswer()">التالي →</button>
      </div>
    `;
  },

  submitAnswer() {
    const answer = document.getElementById('quizAnswer')?.value.trim();
    if (!answer) return window.NY.toast('اكتب إجابتك');
    this.quizAnswers[this.quizIndex] = answer;
    this.quizIndex++;
    this.showQuizQuestion();
  },

  showQuizResult() {
    const area = document.getElementById('quizArea');
    if (!area) return;
    area.innerHTML = `
      <div class="card" style="padding:24px;margin-top:16px;text-align:center">
        <div style="font-size:3em;margin-bottom:12px">🎉</div>
        <div style="color:var(--rgl);font-size:1.2em;font-weight:700">
          أكملت الاختبار!
        </div>
        <div style="color:var(--mut);font-size:0.85em;margin-top:8px">
          أرسل إجاباتك للطرف الآخر ليرى النتيجة
        </div>
        <button class="btn" style="margin-top:16px" onclick="NYGames.sendQuiz()">📤 إرسال</button>
      </div>
    `;
  },

  sendQuiz() {
    const answers = Object.values(this.quizAnswers).join(' | ');
    window.NY.socket.emit('action', {
      type: 'activity',
      payload: '🧩 نتيجتي في اختبار الحب:\n' + answers
    });
    window.NY.toast('📤 تم الإرسال');
    this.currentGame = null;
    window.NY.renderTab('games');
  },

  // ============ Watch Together ============
  renderWatchTogether() {
    return `
      <div class="hd">
        <button onclick="NYGames.currentGame=null; NY.renderTab('games')">→</button>
        <b>🎬 شاهد معاً</b>
        <span style="width:36px"></span>
      </div>

      <div class="card" style="padding:20px;text-align:center">
        <div style="font-size:2em;margin-bottom:8px">🎬</div>
        <div style="color:var(--rgl);font-weight:600">شاهد يوتيوب معاً</div>
      </div>

      <input id="watchUrl" placeholder="الصق رابط يوتيوب..." style="margin-bottom:12px">
      <button class="btn" onclick="NYGames.startWatch()">▶️ شاهد</button>

      <div id="watchArea" style="margin-top:16px"></div>
    `;
  },

  startWatch() {
    const url = document.getElementById('watchUrl')?.value.trim();
    if (!url) return window.NY.toast('الصق رابط');
    
    const id = this.extractYtId(url);
    if (!id) return window.NY.toast('رابط غير صالح');

    // أرسل للطرف الآخر
    window.NY.socket.emit('action', {
      type: 'activity',
      payload: `🎬 شاهد معي:\nhttps://youtu.be/${id}`
    });

    const area = document.getElementById('watchArea');
    if (area) {
      area.innerHTML = `
        <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:16px">
          <iframe src="https://www.youtube.com/embed/${id}?autoplay=1" 
                  style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:16px"
                  allow="autoplay; encrypted-media"></iframe>
        </div>
      `;
    }
  },

  extractYtId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    return null;
  },

  startGame(g) {
    this.currentGame = g;
    window.NY.renderTab('games');
  }
};

console.log('✅ NY Games loaded');