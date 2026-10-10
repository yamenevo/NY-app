window.NYThemes = {
  gold: {
    name: 'ذهبي كلاسيكي',
    rose: '#e8b4a0',
    roseLight: '#f4c9b8',
    roseDark: '#c99380',
    wine: '#8b2e4a',
    gold: '#d4a574',
    bg: '#0a0a0f'
  },
  rose: {
    name: 'وردي رومانسي',
    rose: '#f48fb1',
    roseLight: '#f8bbd0',
    roseDark: '#ec407a',
    wine: '#ad1457',
    gold: '#ff80ab',
    bg: '#1a0a14'
  },
  purple: {
    name: 'بنفسجي ملكي',
    rose: '#ce93d8',
    roseLight: '#e1bee7',
    roseDark: '#ab47bc',
    wine: '#6a1b9a',
    gold: '#ba68c8',
    bg: '#0f0a1a'
  },
  blue: {
    name: 'أزرق ليلي',
    rose: '#90caf9',
    roseLight: '#bbdefb',
    roseDark: '#42a5f5',
    wine: '#1565c0',
    gold: '#64b5f6',
    bg: '#0a0f1a'
  },
  emerald: {
    name: 'زمردي',
    rose: '#80cbc4',
    roseLight: '#b2dfdb',
    roseDark: '#26a69a',
    wine: '#00695c',
    gold: '#4db6ac',
    bg: '#0a1a15'
  }
};

window.NYApplyTheme = function(themeKey) {
  const t = NYThemes[themeKey] || NYThemes.gold;
  const root = document.documentElement;
  root.style.setProperty('--rg', t.rose);
  root.style.setProperty('--rgl', t.roseLight);
  root.style.setProperty('--rgd', t.roseDark);
  root.style.setProperty('--wine', t.wine);
  root.style.setProperty('--gold', t.gold);
  root.style.setProperty('--bk', t.bg);
  localStorage.setItem('ny-theme', themeKey);
};
