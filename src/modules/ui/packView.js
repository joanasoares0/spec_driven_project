import { drawPack } from '../pack.js';
import { mulberry32 } from '../rng.js';
import * as collection from '../collection.js';

const FALLBACK_STAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="308" viewBox="0 0 220 308">' +
  '<rect width="220" height="308" rx="12" fill="#1e3a5f"/>' +
  '<circle cx="110" cy="154" r="66" fill="#0d2040" stroke="#2a5080" stroke-width="4"/>' +
  '<text x="110" y="170" text-anchor="middle" fill="#ffcb05" font-size="44" font-family="sans-serif">?</text>' +
  '</svg>'
)}`;

const FALLBACK_HAND = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="112" viewBox="0 0 80 112">' +
  '<rect width="80" height="112" rx="6" fill="#1e3a5f"/>' +
  '<circle cx="40" cy="56" r="24" fill="#0d2040" stroke="#2a5080" stroke-width="2"/>' +
  '<text x="40" y="63" text-anchor="middle" fill="#ffcb05" font-size="16" font-family="sans-serif">?</text>' +
  '</svg>'
)}`;

let currentPack = null;
let activeIndex = 0;

function buildStageCard() {
  const el = document.createElement('div');
  el.className = 'stage-card stage-card--facedown';
  el.id = 'stage-card';
  el.innerHTML = `
    <div class="stage-card__inner">
      <div class="stage-card__front">
        <img class="stage-card__img" src="" alt="" draggable="false" />
      </div>
      <div class="stage-card__back"></div>
    </div>
    <p class="stage-hint">Clique para revelar</p>
  `;
  el.addEventListener('click', onStageClick);
  return el;
}

function buildHandCard(index) {
  const el = document.createElement('div');
  el.className = 'hand-card hand-card--facedown';
  el.dataset.index = index;
  el.innerHTML = `
    <div class="hand-card__inner">
      <div class="hand-card__front">
        <img class="hand-card__img" src="" alt="" draggable="false" />
      </div>
      <div class="hand-card__back"></div>
    </div>
  `;
  el.addEventListener('click', () => { if (currentPack) navigateTo(index); });
  return el;
}

export function init() {
  const stage = document.getElementById('card-stage');
  stage.innerHTML = '';
  stage.appendChild(buildStageCard());

  const hand = document.getElementById('hand-row');
  hand.innerHTML = '';
  for (let i = 0; i < 6; i++) hand.appendChild(buildHandCard(i));

  document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPack && activeIndex > 0) navigateTo(activeIndex - 1);
  });
  document.getElementById('next-btn').addEventListener('click', () => {
    if (currentPack && activeIndex < 5) navigateTo(activeIndex + 1);
  });
}

function onStageClick() {
  if (!currentPack) return;
  if (!currentPack.revealed.has(activeIndex)) {
    revealCard(activeIndex);
  } else if (activeIndex < 5) {
    navigateTo(activeIndex + 1);
  }
}

export function revealOrAdvance() {
  onStageClick();
}

export function prevCard() {
  if (currentPack && activeIndex > 0) navigateTo(activeIndex - 1);
}

export function nextCard() {
  if (currentPack && activeIndex < 5) navigateTo(activeIndex + 1);
}

function revealCard(index) {
  if (!currentPack || currentPack.revealed.has(index)) return;

  const cardData = currentPack.cards[index];

  // Flip the stage card
  const stageEl = document.getElementById('stage-card');
  const stageImg = stageEl.querySelector('.stage-card__img');
  stageImg.alt = cardData.name;
  stageImg.src = encodeImagePath(cardData.imagePath);
  stageImg.onerror = () => { stageImg.src = FALLBACK_STAGE; stageImg.onerror = null; };
  stageEl.classList.remove('stage-card--facedown');
  stageEl.classList.add('stage-card--revealed');

  const hint = stageEl.querySelector('.stage-hint');
  hint.textContent = index < 5 ? 'Clique para a próxima' : '';

  // Flip the matching hand card
  const handCard = document.querySelector(`.hand-card[data-index="${index}"]`);
  const handImg = handCard.querySelector('.hand-card__img');
  handImg.src = encodeImagePath(cardData.imagePath);
  handImg.onerror = () => { handImg.src = FALLBACK_HAND; handImg.onerror = null; };
  handCard.classList.remove('hand-card--facedown');
  handCard.classList.add('hand-card--revealed');

  currentPack.revealed.add(index);
  collection.add(cardData.id);
  updateCounter();

  if (currentPack.revealed.size === 6) {
    stageEl.querySelector('.stage-hint').textContent = '';
    setTimeout(resetPack, 2500);
  }
}

function navigateTo(index) {
  if (!currentPack || index < 0 || index > 5) return;

  const dir = index >= activeIndex ? 'right' : 'left';
  activeIndex = index;

  document.querySelectorAll('.hand-card').forEach((el, i) => {
    el.classList.toggle('hand-card--active', i === index);
  });

  const stageEl = document.getElementById('stage-card');
  const slideClass = dir === 'right' ? 'stage-card--slide-right' : 'stage-card--slide-left';
  stageEl.classList.remove('stage-card--slide-right', 'stage-card--slide-left');
  void stageEl.offsetWidth; // force reflow so animation restarts

  const cardData = currentPack.cards[index];
  const stageImg = stageEl.querySelector('.stage-card__img');
  const hint = stageEl.querySelector('.stage-hint');
  const isRevealed = currentPack.revealed.has(index);

  if (isRevealed) {
    stageImg.src = encodeImagePath(cardData.imagePath);
    stageEl.classList.remove('stage-card--facedown');
    stageEl.classList.add('stage-card--revealed');
    hint.textContent = index < 5 ? 'Clique para a próxima' : '';
  } else {
    stageImg.src = '';
    stageImg.alt = '';
    stageEl.classList.add('stage-card--facedown');
    stageEl.classList.remove('stage-card--revealed');
    hint.textContent = 'Clique para revelar';
  }

  stageEl.classList.add(slideClass);
  updateCounter();
}

function updateCounter() {
  document.getElementById('card-counter').textContent = `${activeIndex + 1} / 6`;
  document.getElementById('prev-btn').disabled = activeIndex === 0;
  document.getElementById('next-btn').disabled = activeIndex === 5;
}

// Encode special characters in path (e.g. "á" in folder name)
function encodeImagePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

export function openPack(rarityPools) {
  const seed = (Date.now() & 0xFFFFFFFF) ^ (Math.random() * 0xFFFFFFFF | 0);
  const rng = mulberry32(seed);
  const { cards } = drawPack(rarityPools, rng);
  currentPack = { cards, revealed: new Set() };
  activeIndex = 0;

  const stageEl = document.getElementById('stage-card');
  stageEl.className = 'stage-card stage-card--facedown';
  stageEl.classList.remove('stage-card--slide-right', 'stage-card--slide-left', 'stage-card--resetting');
  const stageImg = stageEl.querySelector('.stage-card__img');
  stageImg.src = '';
  stageImg.alt = '';
  stageEl.querySelector('.stage-hint').textContent = 'Clique para revelar';

  document.querySelectorAll('.hand-card').forEach((el, i) => {
    el.className = `hand-card hand-card--facedown${i === 0 ? ' hand-card--active' : ''}`;
    el.querySelector('.hand-card__img').src = '';
  });

  document.getElementById('open-pack-btn').classList.add('hidden');
  document.getElementById('card-nav').classList.remove('hidden');
  updateCounter();
}

export function resetPack() {
  currentPack = null;
  activeIndex = 0;

  const stageEl = document.getElementById('stage-card');
  stageEl.classList.add('stage-card--resetting');
  document.querySelectorAll('.hand-card').forEach(el => el.classList.add('hand-card--resetting'));

  setTimeout(() => {
    stageEl.className = 'stage-card stage-card--facedown';
    const stageImg = stageEl.querySelector('.stage-card__img');
    stageImg.src = '';
    stageImg.alt = '';
    stageEl.querySelector('.stage-hint').textContent = '';
    document.querySelectorAll('.hand-card').forEach(el => {
      el.className = 'hand-card hand-card--facedown';
      el.querySelector('.hand-card__img').src = '';
    });
    document.getElementById('card-nav').classList.add('hidden');
    document.getElementById('open-pack-btn').classList.remove('hidden');
  }, 400);
}

export function isActive() {
  return currentPack !== null && currentPack.revealed.size < 6;
}
