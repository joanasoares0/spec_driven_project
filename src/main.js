import * as packView from './modules/ui/packView.js';
import * as collectionView from './modules/ui/collectionView.js';

export const AppState = {
  cards: [],
  rarityPools: {},
  activeView: 'pack',
};

async function loadCards() {
  const resp = await fetch('assets/data/cards.json');
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

function buildRarityPools(cards) {
  return cards.reduce((pools, card) => {
    if (!pools[card.folder]) pools[card.folder] = [];
    pools[card.folder].push(card);
    return pools;
  }, {});
}

function showError() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error-overlay').classList.remove('hidden');
}

function switchView(view) {
  AppState.activeView = view;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('tab-btn--active', btn.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach(section => {
    section.classList.toggle('view--active', section.id === `${view}-view`);
  });
  if (view === 'collection') collectionView.render();
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
}

function initPackControls() {
  document.getElementById('open-pack-btn')
    .addEventListener('click', () => packView.openPack(AppState.rarityPools));

  document.addEventListener('keydown', e => {
    const nav = document.getElementById('card-nav');
    if (nav.classList.contains('hidden')) return;
    if (e.code === 'Space' || e.code === 'ArrowRight') {
      e.preventDefault();
      packView.revealOrAdvance();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      packView.prevCard();
    }
  });
}

function initQuotaWarning() {
  document.addEventListener('collection:quota-exceeded', () => {
    document.getElementById('quota-banner').classList.remove('hidden');
  }, { once: true });
}

async function init() {
  try {
    const cards = await loadCards();
    AppState.cards = cards;
    AppState.rarityPools = buildRarityPools(cards);

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    packView.init();
    collectionView.init(cards);
    initTabs();
    initPackControls();
    initQuotaWarning();
  } catch (err) {
    console.error('[main] Failed to load cards.json:', err);
    showError();
  }
}

init();
