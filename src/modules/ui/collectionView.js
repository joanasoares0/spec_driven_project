import * as collection from '../collection.js';

const FOLDER_LABELS = {
  '01_comum':              'Comum',
  '02_incomum':            'Incomum',
  '03_raras':              'Rara',
  '04_duplo_raras':        'Dupla Rara',
  '05_arte_secreta':       'Arte Secreta',
  '06_duplo_arte_secreta': 'Dupla Arte',
  '07_legendária':        'Lendária',
};

const FALLBACK_SRC = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140" viewBox="0 0 100 140">' +
  '<rect width="100" height="140" rx="6" fill="#1e3a5f"/>' +
  '<text x="50" y="80" text-anchor="middle" fill="#ffcb05" font-size="20" font-family="sans-serif">?</text>' +
  '</svg>'
)}`;

let allCards = [];
let activeFilters = new Set();

export function init(cards) {
  allCards = cards;
  renderFilters();
  render();
}

function renderFilters() {
  const bar = document.getElementById('filter-bar');
  bar.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn filter-btn--active';
  allBtn.textContent = 'Todas';
  allBtn.dataset.folder = '';
  allBtn.addEventListener('click', () => {
    activeFilters.clear();
    syncFilterButtons();
    render();
  });
  bar.appendChild(allBtn);

  for (const [folder, label] of Object.entries(FOLDER_LABELS)) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = label;
    btn.dataset.folder = folder;
    btn.addEventListener('click', () => {
      if (activeFilters.has(folder)) activeFilters.delete(folder);
      else activeFilters.add(folder);
      syncFilterButtons();
      render();
    });
    bar.appendChild(btn);
  }
}

function syncFilterButtons() {
  const bar = document.getElementById('filter-bar');
  bar.querySelector('[data-folder=""]')
    .classList.toggle('filter-btn--active', activeFilters.size === 0);
  bar.querySelectorAll('[data-folder]:not([data-folder=""])').forEach(btn => {
    btn.classList.toggle('filter-btn--active', activeFilters.has(btn.dataset.folder));
  });
}

export function render() {
  const grid = document.getElementById('collection-grid');
  const owned = collection.getAll();

  const visible = activeFilters.size === 0
    ? allCards
    : allCards.filter(c => activeFilters.has(c.folder));

  grid.innerHTML = '';

  for (const card of visible) {
    const count = owned[card.id] ?? 0;
    const slot = document.createElement('div');
    slot.className = `collection-slot ${count > 0 ? 'collection-slot--owned' : 'collection-slot--unowned'}`;
    slot.dataset.folder = card.folder;
    slot.title = count > 0 ? `${card.name} (×${count})` : card.name;

    if (count > 0) {
      const img = document.createElement('img');
      img.className = 'collection-card-img';
      img.src = card.imagePath;
      img.alt = card.name;
      img.loading = 'lazy';
      img.onerror = () => { img.src = FALLBACK_SRC; img.onerror = null; };
      const badge = document.createElement('span');
      badge.className = 'copy-badge';
      badge.textContent = `×${count}`;
      slot.appendChild(img);
      slot.appendChild(badge);
    } else {
      const sil = document.createElement('div');
      sil.className = 'silhouette';
      sil.setAttribute('aria-label', card.name);
      sil.textContent = '?';
      slot.appendChild(sil);
    }

    grid.appendChild(slot);
  }

  updateCounters(owned);
}

function updateCounters(owned) {
  const total = allCards.length;
  const ownedCount = Object.values(owned).filter(n => n > 0).length;
  document.getElementById('completion-counter').textContent = `${ownedCount} / ${total} cartas`;
  const badge = document.getElementById('collection-counter');
  if (badge) badge.textContent = ownedCount;
}
