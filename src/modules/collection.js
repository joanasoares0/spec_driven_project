const KEY = 'ptcg_collection';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    console.warn('[collection] Corrupt data in localStorage — resetting.');
    localStorage.setItem(KEY, '{}');
    return {};
  }
}

function save(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      document.dispatchEvent(new CustomEvent('collection:quota-exceeded'));
    }
  }
}

export function getAll() {
  return load();
}

export function get(cardId) {
  return load()[cardId] ?? 0;
}

export function add(cardId) {
  const map = load();
  map[cardId] = (map[cardId] ?? 0) + 1;
  save(map);
}
