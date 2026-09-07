const state = { language: 'ru', folder: null, projects: [], filter: 'all' };
const folderInfo = {
  creativity: { title: 'Творчество', enTitle: 'Creativity', description: 'Личные творческие идеи и визуальные эксперименты.' },
  irnby: { title: 'IRNBY', enTitle: 'IRNBY', description: 'Коммерческая съёмка товара — быстро, выразительно и без студии.' },
  clips: { title: 'Клипы', enTitle: 'Clips', description: 'AI-клипы и абсурдные сцены, которые сложно снять в реальности.' }
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function showSection(name) {
  $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.section === name));
  $$('.page-section').forEach((section) => section.classList.toggle('active', section.id === `section-${name}`));
  const labels = { about: 'Обо мне', offer: 'Коммерческое предложение', projects: 'Проекты' };
  $('#breadcrumbCurrent').textContent = labels[name];
  $('.sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderProjects() {
  const grid = $('#projectGrid');
  const query = $('#projectSearch').value.trim().toLowerCase();
  const visible = state.projects.filter((project) => {
    const matchesFolder = !state.folder || project.folder_id === state.folder;
    const matchesFilter = state.filter === 'all' || project.tags.includes(state.filter);
    const text = `${project.title} ${project.description} ${project.tags.join(' ')}`.toLowerCase();
    return matchesFolder && matchesFilter && text.includes(query);
  });
  $('#projectCount').textContent = `${String(visible.length).padStart(2, '0')} ITEMS`;
  grid.innerHTML = visible.length ? visible.map((project) => `
    <article class="project-card"><div class="project-meta"><span>${project.year}</span><span>${project.folder_id.toUpperCase()}</span></div><h3>${project.title}</h3><p>${project.description}</p><div class="tags">${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div></article>`).join('') : '<p class="empty-state">Пока здесь нет проектов. Скоро добавим визуальные материалы.</p>';
}

function openFolder(folder) {
  state.folder = folder;
  const info = folderInfo[folder];
  $('#folderTitle').textContent = state.language === 'en' ? info.enTitle : info.title;
  $('#folderDescription').textContent = info.description;
  $('#folderEyebrow').textContent = `FOLDER / ${folder.toUpperCase()}`;
  $('.folders-grid').hidden = true;
  $('.project-toolbar').hidden = true;
  $('.project-results').hidden = false;
  renderProjects();
}

function closeFolder() {
  state.folder = null;
  $('.folders-grid').hidden = false;
  $('.project-toolbar').hidden = false;
  $('.project-results').hidden = true;
}

function setLanguage() {
  state.language = state.language === 'ru' ? 'en' : 'ru';
  document.documentElement.lang = state.language;
  $('#langToggle').textContent = state.language.toUpperCase();
  $$('[data-ru][data-en]').forEach((node) => { node.textContent = node.dataset[state.language]; });
  if (state.folder) openFolder(state.folder);
}

async function loadData() {
  try {
    const response = await fetch('data/projects.json');
    if (!response.ok) throw new Error('Data unavailable');
    state.projects = await response.json();
  } catch (error) {
    state.projects = [];
  }
}

$$('.nav-item').forEach((item) => item.addEventListener('click', () => showSection(item.dataset.section)));
$$('.folder-card').forEach((card) => card.addEventListener('click', () => openFolder(card.dataset.folder)));
$$('.filter').forEach((button) => button.addEventListener('click', () => { $$('.filter').forEach((b) => b.classList.remove('active')); button.classList.add('active'); state.filter = button.dataset.filter; renderProjects(); }));
$('#projectSearch').addEventListener('input', renderProjects);
$('#backToFolders').addEventListener('click', closeFolder);
$('#langToggle').addEventListener('click', setLanguage);
$('#themeToggle').addEventListener('click', () => { document.body.classList.toggle('light-theme'); $('#themeToggle').textContent = document.body.classList.contains('light-theme') ? '☾' : '☼'; });
$('#mobileMenu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
loadData();
