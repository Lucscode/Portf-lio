// Tema claro/escuro com preferência do usuário
(function(){
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  if (stored === 'light' || (!stored && prefersLight)) {
    root.classList.add('light');
  }

  // Cor principal dinâmica por horário (Brasília UTC-3)
  try{
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: 'numeric' });
    const parts = formatter.formatToParts(now);
    const hour = Number(parts.find(p=>p.type==='hour')?.value ?? now.getHours());
    let primary = '#4f46e5';
    if (hour >= 6 && hour < 12) primary = '#2dd4bf';       // manhã: teal
    else if (hour >= 12 && hour < 18) primary = '#f59e0b';  // tarde: amber
    else if (hour >= 18 && hour < 22) primary = '#6366f1';  // noite: indigo
    else primary = '#a78bfa';                               // madrugada: violet
    root.style.setProperty('--primary', primary);
    // Atualiza favicon com a cor
    const fav = document.getElementById('favicon');
    if (fav){
      const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='${primary}'/><text x='50%' y='54%' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='28' font-weight='700' fill='${root.classList.contains('light') ? '#111111' : '#ffffff'}'>LP</text></svg>`);
      fav.setAttribute('href', `data:image/svg+xml,${svg}`);
    }
  }catch{}

  const btn = document.getElementById('theme-toggle');
  function updateIcon(){
    const isLight = root.classList.contains('light');
    btn.textContent = isLight ? '🌙' : '☀️';
    btn.setAttribute('aria-label', isLight ? 'Alternar para tema escuro' : 'Alternar para tema claro');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }
  btn?.addEventListener('click', ()=>{
    root.classList.toggle('light');
    updateIcon();
  });
  updateIcon();

  // Ano no rodapé com fuso de Brasília (UTC-3)
  try{
    const yearEl = document.getElementById('year');
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric' });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value ?? String(now.getFullYear());
    if (yearEl) yearEl.textContent = year;
  }catch{}

  // Reveal on scroll (IntersectionObserver)
  try{
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced && 'IntersectionObserver' in window){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if (entry.isIntersecting){
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
      document.querySelectorAll('[data-reveal]').forEach(el=> io.observe(el));
    } else {
      document.querySelectorAll('[data-reveal]').forEach(el=> el.classList.add('in-view'));
    }
  } catch {}

  // Tilt leve nos cards
  try{
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card=>{
      let raf = 0;
      function onMove(e){
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // 0 -> w
        const y = e.clientY - rect.top;  // 0 -> h
        const rx = ((y / rect.height) - 0.5) * -8; // rotação X
        const ry = ((x / rect.width) - 0.5) * 8;   // rotação Y
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(()=>{
          card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
      }
      function reset(){ card.style.transform=''; }
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', reset);
    });
  }catch{}

  // Command Palette (Ctrl/Cmd + K)
  try{
    const dialog = document.getElementById('cmdk');
    const input = document.getElementById('cmdk-input');
    const list = document.getElementById('cmdk-list');
    function openCmdk(){ dialog.setAttribute('aria-hidden','false'); input.value=''; input.focus(); filter(''); }
    function closeCmdk(){ dialog.setAttribute('aria-hidden','true'); }
    function filter(q){
      const query = q.toLowerCase();
      list.querySelectorAll('li').forEach(li=>{
        const visible = li.textContent.toLowerCase().includes(query);
        li.style.display = visible ? '' : 'none';
      });
    }
    window.addEventListener('keydown', (e)=>{
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      if (isCmdK){ e.preventDefault(); openCmdk(); }
      if (e.key === 'Escape' && dialog.getAttribute('aria-hidden') === 'false'){ closeCmdk(); }
    });
    dialog.addEventListener('click', (e)=>{
      const target = e.target;
      if (target instanceof HTMLElement && target.dataset.cmdkClose !== undefined) closeCmdk();
    });
    input?.addEventListener('input', (e)=>{ filter(e.target.value); });
    list?.addEventListener('click', (e)=>{
      const li = e.target.closest('li');
      if (!li) return;
      const anchor = li.getAttribute('data-target');
      const link = li.getAttribute('data-link');
      closeCmdk();
      if (anchor){ document.querySelector(anchor)?.scrollIntoView({ behavior:'smooth', block:'start' }); }
      if (link){ window.open(link, '_blank', 'noopener'); }
    });
  }catch{}
})();


