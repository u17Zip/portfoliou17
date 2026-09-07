/* Dynamic GitHub gallery: reads images/videos from projects/creativity, projects/irnby and projects/clips. */
(() => {
  'use strict';

  const state = { language: 'ru', folder: null, filter: 'all', media: [] };
  const MANUAL_REPOSITORY = { owner: '', repo: '', branch: 'main' };
  const folderInfo = {
    creativity: { title: 'Творчество', enTitle: 'Creativity', description: 'Личные творческие идеи и визуальные эксперименты.', enDescription: 'Personal creative ideas and visual experiments.' },
    irnby: { title: 'IRNBY', enTitle: 'IRNBY', description: 'Коммерческая съёмка товара — быстро, выразительно и без студии.', enDescription: 'Commercial product visuals — fast, expressive and studio-free.' },
    clips: { title: 'Клипы', enTitle: 'Clips', description: 'AI-клипы и абсурдные сцены, которые сложно снять в реальности.', enDescription: 'AI clips and impossible scenes that are hard to shoot in reality.' }
  };
  const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg']);
  const videoExtensions = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv']);
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function getRepository() {
    if (MANUAL_REPOSITORY.owner && MANUAL_REPOSITORY.repo) return MANUAL_REPOSITORY;
    const host = window.location.hostname;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (!host.endsWith('.github.io')) return null;
    const owner = host.split('.')[0];
    return { owner, repo: pathParts[0] || `${owner}.github.io`, branch: 'main' };
  }

  function getFileType(name) {
    const extension = name.split('.').pop().toLowerCase();
    if (imageExtensions.has(extension)) return 'image';
    if (videoExtensions.has(extension)) return 'video';
    return null;
  }

  function shuffle(items) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  function rawUrl(repository, path) {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `https://raw.githubusercontent.com/${repository.owner}/${repository.repo}/${repository.branch}/${encodedPath}`;
  }

  async function getFolderFiles(path) {
    const repository = getRepository();
    if (!repository) throw new Error('REPOSITORY_NOT_DETECTED');
    const endpoint = `https://api.github.com/repos/${repository.owner}/${repository.repo}/contents/${path}?ref=${encodeURIComponent(repository.branch)}`;
    const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    const entries = await response.json();
    if (!Array.isArray(entries)) return [];

    const files = [];
    for (const entry of entries) {
      const type = entry.type === 'file' ? getFileType(entry.name) : null;
      if (type) files.push({ name: entry.name, path: entry.path, type, url: entry.download_url || rawUrl(repository, entry.path) });
      if (entry.type === 'dir') {
        const nestedFiles = await getFolderFiles(entry.path);
        files.push(...nestedFiles);
      }
    }
    return files;
  }

  function showSection(name) {
    $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.section === name));
    $$('.page-section').forEach((section) => section.classList.toggle('active', section.id === `section-${name}`));
    const labels = state.language === 'en' ? { about: 'About me', offer: 'Commercial offer', projects: 'Projects' } : { about: 'Обо мне', offer: 'Коммерческое предложение', projects: 'Проекты' };
    const breadcrumb = $('#breadcrumbCurrent');
    if (breadcrumb) breadcrumb.textContent = labels[name] || labels.about;
    $('.sidebar')?.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderMedia() {
    const grid = $('#projectGrid');
    const count = $('#projectCount');
    if (!grid || !count) return;
    const query = ($('#projectSearch')?.value || '').trim().toLowerCase();
    const visible = state.media.filter((item) => (state.filter === 'all' || item.type === state.filter) && item.name.toLowerCase().includes(query));
    count.textContent = `${String(visible.length).padStart(2, '0')} ITEMS`;
    grid.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'В этой папке пока нет подходящих файлов.';
      grid.appendChild(empty);
      return;
    }

    visible.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'media-card';
      const frame = document.createElement('div');
      frame.className = 'media-frame';
      if (item.type === 'image') {
        const image = document.createElement('img');
        image.src = item.url; image.alt = item.name; image.loading = 'lazy'; image.decoding = 'async';
        frame.appendChild(image);
        frame.addEventListener('click', () => openLightbox(item));
      } else {
        const video = document.createElement('video');
        video.src = item.url; video.controls = true; video.preload = 'metadata'; video.playsInline = true;
        frame.appendChild(video);
      }
      const openButton = document.createElement('button');
      openButton.className = 'media-open'; openButton.type = 'button'; openButton.title = 'Открыть'; openButton.textContent = '↗';
      openButton.addEventListener('click', (event) => { event.stopPropagation(); openLightbox(item); });
      frame.appendChild(openButton);
      const footer = document.createElement('div'); footer.className = 'media-footer';
      const name = document.createElement('span'); name.className = 'media-file-name'; name.textContent = item.name;
      const type = document.createElement('span'); type.className = 'media-file-type'; type.textContent = item.type === 'image' ? 'IMAGE' : 'VIDEO';
      footer.append(name, type); card.append(frame, footer); grid.appendChild(card);
    });
  }

  async function openFolder(folder) {
    state.folder = folder;
    const info = folderInfo[folder];
    $('#folderTitle').textContent = state.language === 'en' ? info.enTitle : info.title;
    $('#folderDescription').textContent = state.language === 'en' ? info.enDescription : info.description;
    $('#folderEyebrow').textContent = `FOLDER / ${folder.toUpperCase()}`;
    $('.folders-grid').hidden = true;
    $('.project-toolbar').hidden = true;
    $('.project-results').hidden = false;
    $('#projectGrid').innerHTML = '<p class="empty-state">Загрузка файлов...</p>';
    $('#projectCount').textContent = '...';
    try {
      state.media = shuffle(await getFolderFiles(`projects/${folder}`));
      renderMedia();
    } catch (error) {
      console.error(error);
      const message = error.message === 'REPOSITORY_NOT_DETECTED' ? 'Не удалось определить репозиторий. Открой сайт через GitHub Pages или укажи owner и repo в scripts.js.' : 'Не удалось загрузить файлы. Проверь, что репозиторий публичный и папка существует.';
      $('#projectGrid').innerHTML = `<p class="empty-state">${message}</p>`;
      $('#projectCount').textContent = 'ERROR';
    }
  }

  function closeFolder() {
    state.folder = null; state.media = [];
    $('.folders-grid').hidden = false; $('.project-toolbar').hidden = false; $('.project-results').hidden = true;
  }

  function setupFilters() {
    const definitions = [['all', state.language === 'en' ? 'All' : 'Все'], ['image', state.language === 'en' ? 'Images' : 'Фото'], ['video', state.language === 'en' ? 'Videos' : 'Видео']];
    $$('.filter').forEach((button, index) => {
      if (!definitions[index]) return;
      button.dataset.filter = definitions[index][0]; button.textContent = definitions[index][1];
      button.onclick = () => { $$('.filter').forEach((item) => item.classList.remove('active')); button.classList.add('active'); state.filter = button.dataset.filter; if (state.folder) renderMedia(); };
    });
  }

  function setLanguage() {
    state.language = state.language === 'ru' ? 'en' : 'ru';
    document.documentElement.lang = state.language;
    $('#langToggle').textContent = state.language.toUpperCase();
    $$('[data-ru][data-en]').forEach((node) => { node.textContent = node.dataset[state.language]; });
    setupFilters();
    if (state.folder) {
      const info = folderInfo[state.folder];
      $('#folderTitle').textContent = state.language === 'en' ? info.enTitle : info.title;
      $('#folderDescription').textContent = state.language === 'en' ? info.enDescription : info.description;
    }
    showSection($('.nav-item.active')?.dataset.section || 'about');
  }

  function openLightbox(item) {
    let lightbox = $('#mediaLightbox');
    if (!lightbox) {
      lightbox = document.createElement('div'); lightbox.id = 'mediaLightbox'; lightbox.className = 'media-lightbox';
      lightbox.innerHTML = '<div class="lightbox-backdrop"></div><button class="lightbox-close" type="button" aria-label="Закрыть">×</button><div class="lightbox-content"></div>';
      document.body.appendChild(lightbox);
      const close = () => { lightbox.classList.remove('is-open'); lightbox.querySelector('.lightbox-content').replaceChildren(); document.body.style.overflow = ''; };
      lightbox.querySelector('.lightbox-backdrop').addEventListener('click', close);
      lightbox.querySelector('.lightbox-close').addEventListener('click', close);
      document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
    }
    const content = lightbox.querySelector('.lightbox-content'); content.replaceChildren();
    if (item.type === 'image') { const image = document.createElement('img'); image.src = item.url; image.alt = item.name; content.appendChild(image); }
    else { const video = document.createElement('video'); video.src = item.url; video.controls = true; video.autoplay = true; video.playsInline = true; content.appendChild(video); }
    lightbox.classList.add('is-open'); document.body.style.overflow = 'hidden';
  }

  $$('.nav-item').forEach((item) => item.addEventListener('click', () => showSection(item.dataset.section)));
  $$('.folder-card').forEach((card) => card.addEventListener('click', () => openFolder(card.dataset.folder)));
  $('#projectSearch')?.addEventListener('input', () => { if (state.folder) renderMedia(); });
  $('#backToFolders')?.addEventListener('click', closeFolder);
  $('#langToggle')?.addEventListener('click', setLanguage);
  $('#themeToggle')?.addEventListener('click', () => { document.body.classList.toggle('light-theme'); $('#themeToggle').textContent = document.body.classList.contains('light-theme') ? '☾' : '☼'; });
  $('#mobileMenu')?.addEventListener('click', () => $('.sidebar')?.classList.toggle('open'));
  setupFilters();
})();
