// ============ NY Partner Clock ============
window.NYClock = {
  cities: [
    { name: 'دمشق', tz: 'Asia/Damascus', emoji: '🇸🇾' },
    { name: 'بغداد', tz: 'Asia/Baghdad', emoji: '🇮🇶' },
    { name: 'الرياض', tz: 'Asia/Riyadh', emoji: '🇸🇦' },
    { name: 'دبي', tz: 'Asia/Dubai', emoji: '🇦🇪' },
    { name: 'القاهرة', tz: 'Africa/Cairo', emoji: '🇪🇬' },
    { name: 'بيروت', tz: 'Asia/Beirut', emoji: '🇱🇧' },
    { name: 'عمّان', tz: 'Asia/Amman', emoji: '🇯🇴' },
    { name: 'الكويت', tz: 'Asia/Kuwait', emoji: '🇰🇼' },
    { name: 'الدوحة', tz: 'Asia/Qatar', emoji: '🇶🇦' },
    { name: 'مسقط', tz: 'Asia/Muscat', emoji: '🇴🇲' },
    { name: 'الخرطوم', tz: 'Africa/Khartoum', emoji: '🇸🇩' },
    { name: 'تونس', tz: 'Africa/Tunis', emoji: '🇹🇳' },
    { name: 'الجزائر', tz: 'Africa/Algiers', emoji: '🇩🇿' },
    { name: 'الرباط', tz: 'Africa/Casablanca', emoji: '🇲🇦' },
    { name: 'لندن', tz: 'Europe/London', emoji: '🇬🇧' },
    { name: 'باريس', tz: 'Europe/Paris', emoji: '🇫🇷' },
    { name: 'إستنبول', tz: 'Europe/Istanbul', emoji: '🇹🇷' },
    { name: 'نيويورك', tz: 'America/New_York', emoji: '🇺🇸' },
    { name: 'تورنتو', tz: 'America/Toronto', emoji: '🇨🇦' },
    { name: 'برلين', tz: 'Europe/Berlin', emoji: '🇩🇪' }
  ],

  render() {
    const myCity = localStorage.getItem('ny-my-city') || 'Asia/Damascus';
    const partnerCity = localStorage.getItem('ny-partner-city') || 'Asia/Riyadh';

    return `
      <div style="padding:12px">
        <div class="card" style="padding:20px;text-align:center;margin-bottom:16px">
          <div style="font-size:2em;margin-bottom:8px">🌙</div>
          <div style="color:var(--rg);font-weight:700">ساعة الحبيب</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="card2" style="text-align:center;padding:20px">
            <div style="color:var(--mut);font-size:0.75em;letter-spacing:2px">أنت</div>
            <div style="font-size:2.5em;color:var(--rg);font-family:'Reem Kufi',serif;font-weight:700;margin:8px 0" id="myClock">
              --:--
            </div>
            <div style="color:var(--rgl);font-size:0.85em">${myCity.split('/')[1] || myCity}</div>
          </div>

          <div class="card2" style="text-align:center;padding:20px">
            <div style="color:var(--mut);font-size:0.75em;letter-spacing:2px">حبيبك</div>
            <div style="font-size:2.5em;color:var(--rg);font-family:'Reem Kufi',serif;font-weight:700;margin:8px 0" id="partnerClock">
              --:--
            </div>
            <div style="color:var(--rgl);font-size:0.85em">${partnerCity.split('/')[1] || partnerCity}</div>
          </div>
        </div>

        <div class="card" style="text-align:center;padding:16px">
          <div style="color:var(--mut);font-size:0.85em;margin-bottom:8px">فرق التوقيت</div>
          <div style="color:var(--rg);font-size:1.3em;font-weight:700" id="timeDiff">
            -- ساعة
          </div>
        </div>

        <h3 style="color:var(--rg);font-size:0.95em;margin:20px 0 12px">اختر مدينتك:</h3>
        <select id="myCitySelect" onchange="NYClock.saveMyCity(this.value)" 
                style="margin-bottom:16px;padding:12px;background:rgba(232,180,160,0.08);border-radius:12px;color:white;border:1px solid var(--rgd)">
          ${this.cities.map(c => `
            <option value="${c.tz}" ${myCity === c.tz ? 'selected' : ''}>
              ${c.emoji} ${c.name}
            </option>
          `).join('')}
        </select>

        <h3 style="color:var(--rg);font-size:0.95em;margin-bottom:12px">اختر مدينة حبيبك:</h3>
        <select id="partnerCitySelect" onchange="NYClock.savePartnerCity(this.value)"
                style="padding:12px;background:rgba(232,180,160,0.08);border-radius:12px;color:white;border:1px solid var(--rgd)">
          ${this.cities.map(c => `
            <option value="${c.tz}" ${partnerCity === c.tz ? 'selected' : ''}>
              ${c.emoji} ${c.name}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  },

  attachEvents() {
    this.tick();
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const myTz = localStorage.getItem('ny-my-city') || 'Asia/Damascus';
    const partnerTz = localStorage.getItem('ny-partner-city') || 'Asia/Riyadh';

    const myTime = this.getTimeInTz(myTz);
    const partnerTime = this.getTimeInTz(partnerTz);

    const myEl = document.getElementById('myClock');
    const partnerEl = document.getElementById('partnerClock');
    const diffEl = document.getElementById('timeDiff');

    if (myEl) myEl.textContent = myTime.str;
    if (partnerEl) partnerEl.textContent = partnerTime.str;
    
    if (diffEl) {
      const diff = partnerTime.hours - myTime.hours;
      if (diff === 0) diffEl.textContent = 'نفس التوقيت 🎉';
      else if (diff > 0) diffEl.textContent = `عند حبيبك +${diff} ساعة`;
      else diffEl.textContent = `عند حبيبك ${diff} ساعة`;
    }
  },

  getTimeInTz(tz) {
    const now = new Date();
    const str = now.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const [h, m] = str.split(':').map(Number);
    return {
      str: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      hours: h,
      minutes: m
    };
  },

  saveMyCity(tz) {
    localStorage.setItem('ny-my-city', tz);
    this.tick();
  },

  savePartnerCity(tz) {
    localStorage.setItem('ny-partner-city', tz);
    this.tick();
  }
};

console.log('✅ NY Clock loaded');