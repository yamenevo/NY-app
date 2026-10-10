// ============ NY AI Assistant (Local) ============
window.NYAI = {
  history: [],

  responses: {
    greetings: {
      keywords: ['مرحبا', 'السلام', 'أهلا', 'هاي', 'هلا', 'صباح', 'مساء', 'كيفك', 'كيف حالك'],
      replies: [
        'أهلاً بك يا قلبي! 💎 كيف أساعدك اليوم؟',
        'مرحباً! 💕 أنا هنا لأساعدك في أي شيء.',
        'هلا والله! 💖 اسألني أي شيء عن التطبيق أو عن الحب!',
        'أهلاً وسهلاً! 🌹 كيف حالك اليوم؟'
      ]
    },
    love: {
      keywords: ['حب', 'أحب', 'عشق', 'قلب', 'غرام', 'هيام'],
      replies: [
        'الحب هو أن تضع قلبك بين يدي من تحب. 💕',
        'أحبك يعني: أنت الأهم، والباقي تفاصيل. 💖',
        'الحب الحقيقي لا يضعف مع المسافة. 💎',
        'قلبك يستحق كل الحب في هذا العالم. ❤️'
      ]
    },
    advice: {
      keywords: ['نصيحة', 'أشير', 'ماذا أفعل', 'كيف', 'ساعدني'],
      replies: [
        '💡 نصيحتي: الصدق ثم الصدق ثم الصدق.',
        '🌟 الأهم: الاستماع أكثر من الكلام.',
        '💕 لا تنتظر المناسبات لتقول "أحبك".',
        '✨ الاهتمام الصغير أفضل من الهدايا الكبيرة.'
      ]
    },
    sad: {
      keywords: ['حزين', 'زعلان', 'تعبان', 'مكتئب', 'ضايق'],
      replies: [
        '💙 أنا معك. تذكر: كل شيء سيكون بخير.',
        '🤗 ابتسم! هناك من يحبك كثيراً.',
        '💕 لا تنسَ: بعد كل ليلة فجر جديد.',
        '🌹 الحزن مؤقت، والحب باقٍ.'
      ]
    },
    about: {
      keywords: ['من أنت', 'ما اسمك', 'مين انت'],
      replies: [
        'أنا NY Assistant 💎 — مساعدك الذكي داخل التطبيق.',
        'أنا هنا لأساعدك في التطبيق وأشاركك اللحظات 💕',
        'اسمي NY Bot 🤖 — صديقك في الحب والحياة.'
      ]
    }
  },

  render() {
    return `
      <div class="ai-container" style="display:flex;flex-direction:column;height:100%">
        <div class="ai-messages" id="aiMessages" 
             style="flex:1;overflow-y:auto;padding:8px 4px;display:flex;flex-direction:column;gap:8px;max-height:55vh">
          <div class="ai-msg assistant" style="align-self:flex-start;background:rgba(139,46,74,0.3);border:1px solid rgba(212,165,116,0.3);padding:12px 16px;border-radius:16px;max-width:80%;font-size:0.9em">
            <b style="color:var(--rg)">💎 NY Assistant</b><br>
            مرحباً! أنا مساعدك الذكي.<br>
            اسألني عن أي شيء — الحب، التطبيق، أو نصائح.
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <input type="text" id="aiInput" placeholder="اسألني أي شيء..." 
                 style="flex:1;margin:0"
                 onkeypress="if(event.key==='Enter')NYAI.send()">
          <button class="btn" onclick="NYAI.send()" style="width:auto;padding:12px 20px">📤</button>
        </div>
      </div>
    `;
  },

  send() {
    const input = document.getElementById('aiInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    this.appendMessage(text, 'user');
    input.value = '';

    // Simulate thinking
    setTimeout(() => {
      const response = this.getResponse(text);
      this.appendMessage(response, 'assistant');
    }, 600);
  },

  getResponse(text) {
    const lower = text.toLowerCase();
    
    for (const category of Object.values(this.responses)) {
      if (category.keywords.some(k => lower.includes(k))) {
        return window.NY.pick(category.replies);
      }
    }

    // Default responses
    const defaults = [
      '🤔 سؤال مثير! أخبرني أكثر...',
      '💭 أفكر في هذا... يمكنك توضيح أكثر؟',
      '✨ لم أفهم تماماً. جرب السؤال بطريقة أخرى.',
      '🎯 يمكنني مساعدتك بشكل أفضل إذا كنت أكثر تحديداً.'
    ];
    return window.NY.pick(defaults);
  },

  appendMessage(text, role) {
    const container = document.getElementById('aiMessages');
    if (!container) return;

    const isUser = role === 'user';
    const html = `
      <div class="ai-msg ${role}" style="
        align-self:${isUser ? 'flex-end' : 'flex-start'};
        ${isUser ? 'background:linear-gradient(135deg,var(--wine),var(--rgd));color:white' : 'background:rgba(139,46,74,0.3);border:1px solid rgba(212,165,116,0.3)'};
        padding:10px 14px;border-radius:16px;max-width:80%;font-size:0.9em;line-height:1.6">
        ${isUser ? '<b style="color:var(--rgl);font-size:0.85em">أنت</b><br>' : '<b style="color:var(--rg);font-size:0.85em">💎 NY</b><br>'}
        ${window.NY.esc(text)}
      </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    container.scrollTop = container.scrollHeight;
  }
};

console.log('✅ NY AI loaded');