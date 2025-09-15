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

  // Avatar fallback se a imagem não carregar
  try{
    const photo = document.querySelector('.avatar-photo');
    const fallback = document.querySelector('.avatar-fallback');
    if (photo && fallback){
      // força atualização do cache no GitHub Pages
      const cacheBuster = `v=${new Date().getTime()}`;
      if (!/v=\d+/.test(photo.src)){
        const joiner = photo.src.includes('?') ? '&' : '?';
        photo.src = `${photo.src}${joiner}${cacheBuster}`;
      }
      function hideFallback(){ fallback.style.display = 'none'; }
      function showFallback(){ fallback.style.display = 'grid'; }
      if (photo.complete && photo.naturalWidth > 0){ hideFallback(); }
      photo.addEventListener('load', hideFallback);
      photo.addEventListener('error', showFallback);
    }
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

  // Ícones automáticos nas competências
  try{
    const svgIcons = {
      'HTML5': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#E34F26" d="M3 2l1.64 18.56L12 22l7.36-1.44L21 2H3z"/><path fill="#fff" d="M17.28 7.37l-.17 1.9-4.45 1.92.01-.02H8.5l.12 1.39h3.93l-.15 1.62L12 14.94l-3.37-.9-.21-2.33H6.98l.37 4.15L12 17.2l4.59-1.14.62-6.85H9.36l-.13-1.49h8.05z"/></svg>`,
      'CSS3': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1572B6" d="M3 2l1.64 18.56L12 22l7.36-1.44L21 2H3z"/><path fill="#fff" d="M17.3 6.9l-.2 2.2-4.5 1.9H8.5l.1 1.4h4l-.2 1.9-2.4.7-3.4-.9-.2-2.3H7l.4 4.1L12 17.2l4.6-1.1.6-6.8H9.2l-.1-1.4h8.2z"/></svg>`,
      'JavaScript (ES6+)': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#F7DF1E"/><path d="M10.7 17.6c0 1.4-.8 2-2 2-.9 0-1.4-.5-1.8-1.1l1.1-.7c.2.3.4.6.8.6.4 0 .7-.2.7-.8v-4.2h1.2v4.2Zm2.1-.1c.3.6.7 1.1 1.5 1.1.6 0 1-.3 1-.7 0-.5-.4-.7-1.1-1l-.4-.2c-1.1-.5-1.8-1.1-1.8-2.4 0-1.2.9-2.1 2.3-2.1 1 0 1.7.3 2.2 1.3l-1.1.7c-.2-.5-.5-.7-1-.7s-.8.3-.8.7c0 .5.3.7 1.1 1l.4.2c1.3.6 2 1.2 2 2.5 0 1.4-1.1 2.2-2.6 2.2-1.4 0-2.3-.7-2.8-1.6l1.1-.7Z" fill="#000"/></svg>`,
      'TypeScript': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#3178C6"/><path fill="#fff" d="M13.2 10.3h-2.1V9h6.1v1.3h-2.1v6.2h-1.9v-6.2Z"/><path fill="#fff" d="M7.1 11h3.6v1.3H9.6v4.2H7.7v-4.2H7.1V11Z"/></svg>`,
      'React.js': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2" fill="#61DAFB"/><g fill="none" stroke="#61DAFB" stroke-width="1.5"><ellipse cx="12" cy="12" rx="10" ry="4.5"/><ellipse cx="12" cy="12" rx="4.5" ry="10" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="4.5" ry="10" transform="rotate(120 12 12)"/></g></svg>`,
      'Next.js': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#000"/><path d="M6.5 7.5h2V16h-2V7.5Zm5.5 0h2V13l2.8 3h-2.5l-2.3-2.8V7.5Z" fill="#fff"/></svg>`,
      'Tailwind CSS': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6c-2.7 0-4.4 1.3-5 3.9.8-1.3 1.8-1.8 3.1-1.5.7.2 1.2.7 1.8 1.2C12.6 10.5 13.5 11 15 11c2.7 0 4.4-1.3 5-3.9-.8 1.3-1.8 1.8-3.1 1.5-.7-.2-1.2-.7-1.8-1.2C14.4 6.5 13.5 6 12 6Zm-5 6c-2.7 0-4.4 1.3-5 3.9.8-1.3 1.8-1.8 3.1-1.5.7.2 1.2.7 1.8 1.2.7.9 1.6 1.4 3.1 1.4 2.7 0 4.4-1.3 5-3.9-.8 1.3-1.8 1.8-3.1 1.5-.7-.2-1.2-.7-1.8-1.2-.8-.9-1.7-1.4-3.1-1.4Z" fill="#38BDF8"/></svg>`,
      'Node.js': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" fill="#83CD29"/><path d="M12 8c2.9 0 4.7 1.5 4.7 4.1s-1.8 4.1-4.7 4.1c-2 0-3.6-.7-4.4-2l1.8-1c.4.8 1.2 1.3 2.6 1.3 1.5 0 2.4-.7 2.4-2.2S13.5 10 12 10c-1.1 0-1.7.3-2.2.8l-.2.2-1.6-.9c.8-1.2 2.2-2.1 4-2.1Z" fill="#fff"/></svg>`,
      'Python': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#3776AB"/><path d="M7 8c0-1.7 1.4-3 3-3h4c1.7 0 3 1.3 3 3v2H10c-1.7 0-3 1.3-3 3v2H7c-1.7 0-3-1.3-3-3V11c0-1.7 1.3-3 3-3Z" fill="#FFE873"/></svg>`,
      'SQLite': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0F80CC"/><path d="M7 7h10v10H7z" fill="#fff"/><path d="M9 9h6v6H9z" fill="#0F80CC"/></svg>`,
      'MySQL': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#00758F"/><path d="M6 16c1.5-3.5 5-6 9-6 1.3 0 2 .7 3 1.5-.5 2.2-2.5 4.5-5 5.5-2.5 1-5.5.8-7-.9Z" fill="#fff"/></svg>`,
      'Supabase': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h12l-6 8h6L8 20l2.8-6H6L12 4Z" fill="#3ECF8E"/></svg>`,
      'PowerBI (noções)': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#F2C811"/><path d="M6 6h12v12H6z" fill="#fff"/><path d="M8 8h8v8H8z" fill="#F2C811"/><path d="M10 10h4v4h-4z" fill="#fff"/></svg>`,
      'ChatGPT': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#10A37F"/><path d="M8 9.5c0-1.4 1.1-2.5 2.5-2.5.6 0 1.1.2 1.5.5.4-.3.9-.5 1.5-.5C14.9 7 16 8.1 16 9.5c0 .3 0 .6-.1.8.7.4 1.1 1.1 1.1 1.9 0 1.2-1 2.1-2.1 2.1-.2 0-.5 0-.7-.1-.4.6-1.1 1-1.8 1-.8 0-1.5-.4-1.9-1-.2.1-.5.1-.7.1C8.1 14.3 7 13.2 7 11.8c0-.8.4-1.5 1.1-1.9-.1-.2-.1-.4-.1-.6Z" fill="#fff"/></svg>`,
      'Gemini': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4285F4"/><stop offset="1" stop-color="#9C27B0"/></linearGradient></defs><circle cx="12" cy="12" r="10" fill="url(#g)"/></svg>`,
      'Lovable': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-6-3.8-8.2-6C1.7 11.9 2 8.6 4.3 7.2 6 6 8.1 6.6 9.3 8c.4.5.7 1 .7 1s.3-.5.7-1c1.2-1.4 3.3-2 5-0.8 2.3 1.4 2.6 4.7.5 6.8C18 16.2 12 20 12 20Z" fill="#FF5A79"/></svg>`,
      'Cursor': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3l14 7-6 2-2 6-6-15Z" fill="#7C3AED"/></svg>`,
      'Replit': `<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#667EEA"/><path d="M8 6h8v2H8V6zm0 3h8v2H8V9zm0 3h6v2H8v-2z" fill="#fff"/></svg>`
    };
    document.querySelectorAll('.chips-list li').forEach(li=>{
      const tech = li.textContent.trim();
      const icon = svgIcons[tech];
      if (icon && !li.dataset.iconApplied){
        li.dataset.iconApplied = 'true';
        li.innerHTML = icon + li.innerHTML;
      }
    });
  }catch{}

  // Buscar projetos do GitHub com paginação
  try{
    let allRepos = [];
    let currentPage = 0;
    const projectsPerPage = 4;
    
    // Função para verificar se vídeo existe
    async function checkVideoExists(videoPath) {
      try {
        const response = await fetch(videoPath, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    }
    
    // Criar modal para vídeos
    function createVideoModal() {
      const modal = document.createElement('div');
      modal.id = 'video-modal';
      modal.className = 'video-modal';
      modal.innerHTML = `
        <div class="modal-backdrop" data-close-modal></div>
        <div class="modal-content">
          <button class="modal-close" data-close-modal>×</button>
          <video id="modal-video" controls autoplay>
            <source src="" type="video/mp4">
            Seu navegador não suporta vídeos.
          </video>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Event listeners para fechar modal
      modal.addEventListener('click', (e) => {
        if (e.target.dataset.closeModal) {
          closeVideoModal();
        }
      });
      
      // Fechar com ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
          closeVideoModal();
        }
      });
    }
    
    function openVideoModal(videoPath) {
      const modal = document.getElementById('video-modal');
      const video = document.getElementById('modal-video');
      if (modal && video) {
        video.src = videoPath;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
      }
    }
    
    function closeVideoModal() {
      const modal = document.getElementById('video-modal');
      const video = document.getElementById('modal-video');
      if (modal && video) {
        video.pause();
        video.src = '';
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    
    async function loadGitHubProjects(){
      const username = 'Lucscode';
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=20`);
      if (!response.ok) return;
      
      const repos = await response.json();
      
      // Filtrar repositórios relevantes
      allRepos = repos.filter(repo => 
        !repo.fork && 
        repo.description && 
        !repo.name.includes('Portf-lio') && // excluir este portfólio
        repo.size > 0 // tem código
      );
      
      if (allRepos.length === 0) return;
      
      // Criar modal de vídeo
      createVideoModal();
      
      // Criar interface de paginação
      createPaginationInterface();
      showProjectsPage(0);
    }
    
    function createPaginationInterface(){
      const projectsSection = document.querySelector('#projetos .container');
      if (!projectsSection) return;
      
      // Adicionar controles de paginação
      const paginationHTML = `
        <div class="pagination-controls">
          <button id="prev-page" class="btn outline" disabled>← Anterior</button>
          <span id="page-info" class="page-info">Página 1 de ${Math.ceil(allRepos.length / projectsPerPage)}</span>
          <button id="next-page" class="btn outline">Próximo →</button>
        </div>
      `;
      
      // Inserir antes do grid
      const grid = projectsSection.querySelector('.projects-grid');
      if (grid) {
        grid.insertAdjacentHTML('afterend', paginationHTML);
        
        // Event listeners
        document.getElementById('prev-page')?.addEventListener('click', () => {
          if (currentPage > 0) showProjectsPage(currentPage - 1);
        });
        
        document.getElementById('next-page')?.addEventListener('click', () => {
          if (currentPage < Math.ceil(allRepos.length / projectsPerPage) - 1) {
            showProjectsPage(currentPage + 1);
          }
        });
      }
    }
    
    async function showProjectsPage(page){
      currentPage = page;
      const projectsContainer = document.querySelector('.projects-grid');
      if (!projectsContainer) return;
      
      // Se for a primeira página, mostrar projetos fixos
      if (page === 0) {
        // Restaurar projetos fixos do HTML
        projectsContainer.innerHTML = `
          <article class="project-card">
            <h3>Controlerf — App de controle financeiro</h3>
            <p>Stack: React + TypeScript + Tailwind</p>
            <div class="card-actions">
              <a class="btn small" href="https://github.com/Lucscode" target="_blank" rel="noopener">Ver repositório</a>
            </div>
          </article>
          <article class="project-card">
            <h3>SaaS Médico — Agendamento de consultas</h3>
            <p>Stack: Next.js + TypeScript + Tailwind</p>
            <div class="card-actions">
              <a class="btn small" href="https://github.com/Lucscode" target="_blank" rel="noopener">Ver repositório</a>
            </div>
          </article>
          <article class="project-card">
            <h3>ManagerApp — Gestão para lava-rápido</h3>
            <p>Stack: React + Node.js + SQLite</p>
            <div class="card-actions">
              <a class="btn small" href="https://github.com/Lucscode" target="_blank" rel="noopener">Ver repositório</a>
            </div>
          </article>
          <article class="project-card">
            <h3>ArcusIT — Plataforma de atendimento</h3>
            <p>Stack: HTML + CSS + JavaScript</p>
            <div class="card-actions">
              <a class="btn small" href="https://github.com/Lucscode" target="_blank" rel="noopener">Ver repositório</a>
            </div>
          </article>
        `;
        updatePaginationControls();
        return;
      }
      
      // Para páginas seguintes, mostrar projetos do GitHub
      const startIndex = (page - 1) * projectsPerPage; // Ajustar índice para pular página 0
      const endIndex = startIndex + projectsPerPage;
      const pageRepos = allRepos.slice(startIndex, endIndex);
      
      // Limpar projetos estáticos
      projectsContainer.innerHTML = '';
      
      // Criar cards dinâmicos
      for (const repo of pageRepos) {
        const card = document.createElement('article');
        card.className = 'project-card';
        
        // Buscar linguagens do repositório
        const languagesResponse = await fetch(`https://api.github.com/repos/Lucscode/${repo.name}/languages`);
        const languages = languagesResponse.ok ? await languagesResponse.json() : {};
        const languageList = Object.keys(languages).slice(0, 3); // máximo 3 linguagens
        
        // Cores das linguagens
        const languageColors = {
          'JavaScript': '#F7DF1E',
          'TypeScript': '#3178C6',
          'Python': '#3776AB',
          'React': '#61DAFB',
          'HTML': '#E34F26',
          'CSS': '#1572B6',
          'Java': '#ED8B00',
          'PHP': '#777BB4',
          'Vue': '#4FC08D',
          'Angular': '#DD0031',
          'Node.js': '#339933',
          'C#': '#239120',
          'C++': '#00599C',
          'Go': '#00ADD8',
          'Rust': '#000000',
          'Swift': '#FA7343',
          'Kotlin': '#7F52FF',
          'Dart': '#0175C2',
          'Ruby': '#CC342D',
          'Shell': '#89E051'
        };
        
        const mainLanguage = languageList[0] || 'Mixed';
        const color = languageColors[mainLanguage] || '#6B7280';
        
        // Gerar preview simples baseado no tipo de conteúdo
        const hasImage = repo.name.toLowerCase().includes('image') || repo.description.toLowerCase().includes('screenshot');
        
        let previewContent = '';
        if (hasImage) {
          previewContent = `
            <div class="image-preview">
              <div class="image-placeholder">🖼️</div>
              <div class="image-label">Screenshots</div>
            </div>
          `;
        } else {
          // Preview com código simulado
          const codeLines = [
            'function init() {',
            '  const app = new App();',
            '  app.start();',
            '}',
            '',
            '// Inicializar aplicação',
            'init();'
          ];
          
          previewContent = `
            <div class="code-preview">
              <div class="code-header">
                <div class="code-dots">
                  <span></span><span></span><span></span>
                </div>
                <span class="code-filename">${mainLanguage.toLowerCase()}</span>
              </div>
              <div class="code-content">
                ${codeLines.map(line => 
                  line ? `<div class="code-line">${line}</div>` : '<div class="code-line empty"></div>'
                ).join('')}
              </div>
            </div>
          `;
        }
        
        card.innerHTML = `
          <div class="project-header">
            <h3>${repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
            <div class="language-badge" style="background: ${color}; color: white;">${mainLanguage}</div>
          </div>
          <div class="project-preview" style="background: linear-gradient(135deg, ${color}20, ${color}10); border-left: 4px solid ${color};">
            <div class="preview-content">
              ${previewContent}
            </div>
          </div>
          <div class="project-content">
            <p>${repo.description}</p>
            <div class="project-languages">
              ${languageList.map(lang => `
                <span class="language-tag" style="background: ${languageColors[lang] || '#6B7280'}20; color: ${languageColors[lang] || '#6B7280'}; border: 1px solid ${languageColors[lang] || '#6B7280'}40;">
                  ${lang}
                </span>
              `).join('')}
            </div>
            <div class="card-actions">
              <a class="btn small" href="${repo.html_url}" target="_blank" rel="noopener">Ver código</a>
              ${repo.homepage ? `<a class="btn small outline" href="${repo.homepage}" target="_blank" rel="noopener">Demo</a>` : ''}
            </div>
          </div>
        `;
        projectsContainer.appendChild(card);
      }
      
      // Adicionar event listeners para mini reprodutores
      projectsContainer.querySelectorAll('.mini-player').forEach(miniPlayer => {
        const video = miniPlayer.querySelector('.mini-video');
        const playBtn = miniPlayer.querySelector('.play-pause-btn');
        const progressBar = miniPlayer.querySelector('.progress-bar');
        const durationSpan = miniPlayer.querySelector('.video-duration');
        
        // Play/Pause
        playBtn.addEventListener('click', () => {
          if (video.paused) {
            video.play();
            playBtn.textContent = '⏸️';
          } else {
            video.pause();
            playBtn.textContent = '▶️';
          }
        });
        
        // Atualizar progresso
        video.addEventListener('timeupdate', () => {
          const progress = (video.currentTime / video.duration) * 100;
          progressBar.style.width = `${progress}%`;
        });
        
        // Atualizar duração
        video.addEventListener('loadedmetadata', () => {
          const minutes = Math.floor(video.duration / 60);
          const seconds = Math.floor(video.duration % 60);
          durationSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        });
        
        // Click no vídeo para abrir modal
        video.addEventListener('click', () => {
          const videoPath = playBtn.dataset.video;
          openVideoModal(videoPath);
        });
      });
      
      // Event listeners para botões de teste
      projectsContainer.querySelectorAll('.test-video-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const repoName = btn.dataset.repo;
          const possiblePaths = [
            `Projetos/${repoName}/video.mp4`,
            `Projetos/${repoName}/demo.mp4`,
            `Projetos/${repoName}/preview.mp4`,
            `videos/${repoName}.mp4`
          ];
          
          btn.textContent = 'Testando...';
          for (const path of possiblePaths) {
            if (await checkVideoExists(path)) {
              btn.textContent = `✅ Encontrado: ${path}`;
              // Recarregar a página para mostrar o vídeo
              setTimeout(() => location.reload(), 1000);
              return;
            }
          }
          btn.textContent = '❌ Não encontrado';
        });
      });
      
      // Atualizar controles de paginação
      updatePaginationControls();
    }
    
    function updatePaginationControls(){
      const githubPages = Math.ceil(allRepos.length / projectsPerPage);
      const totalPages = githubPages + 1; // +1 para a página de projetos fixos
      const prevBtn = document.getElementById('prev-page');
      const nextBtn = document.getElementById('next-page');
      const pageInfo = document.getElementById('page-info');
      
      if (prevBtn) prevBtn.disabled = currentPage === 0;
      if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
      if (pageInfo) pageInfo.textContent = `Página ${currentPage + 1} de ${totalPages}`;
    }
    
    // Carregar projetos após 1 segundo
    setTimeout(loadGitHubProjects, 1000);
  }catch{}
})();


