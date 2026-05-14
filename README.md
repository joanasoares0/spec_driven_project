# Pokémon TCG 151 — Abre Boosters

Simulador de abertura de boosters do set **Scarlet & Violet — 151 (sv3pt5)**. Abre pacotes, revela cartas uma a uma e constrói a tua coleção completa das 165 cartas.

![stack](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white) ![js](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black) ![tests](https://img.shields.io/badge/Vitest-passing-6E9F18?logo=vitest&logoColor=white)

---

## Funcionalidades

- **Mão de cartas** — 6 cartas em leque; a carta activa sobe em destaque no topo
- **Flip 3D** — clique revela a carta com animação de virar; clique seguinte avança
- **Navegação** — botões ‹ › ou teclas `←` `→` / `Space` percorrem a mão
- **Probabilidades reais** — slots 1–4 comuns, slot 5 (90% incomum / 10% rara), slot 6 (60/25/10/4.5/0.5 distribuição)
- **Coleção persistente** — guarda em `localStorage`; tab dedicada com 165 slots, silhuetas para cartas por obter e contador de cópias
- **Filtros por raridade** — filtra a coleção por tier
- **Offline** — zero backend; corre inteiramente no browser após download dos assets

---

## Requisitos

- Node.js 18+
- Python 3.10+ (apenas para download dos assets)
- Chave da API [pokemontcg.io](https://pokemontcg.io) (gratuita)

---

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Download das imagens das cartas (~165 ficheiros JPG)
POKEMONTCG_API_KEY=<a-tua-chave> python download_cards.py

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

Abre `http://localhost:5173` no browser.

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Preview do build de produção |
| `npm test` | Testes unitários (Vitest) |

---

## Estrutura

```
assets/
  01_comum/          # imagens por raridade (geradas pelo script)
  02_incomum/
  03_raras/
  04_duplo_raras/
  05_arte_secreta/
  06_duplo_arte_secreta/
  07_legendária/
  data/cards.json    # manifesto gerado pelo script
src/
  main.js            # bootstrap e navegação entre tabs
  modules/
    pack.js          # lógica de sorteio de pacote (distribuição por slots)
    rng.js           # RNG determinístico mulberry32
    collection.js    # persistência em localStorage
    ui/
      packView.js    # UI de abertura (stage + mão)
      collectionView.js
  styles/main.css
tests/               # testes Vitest (distribuição, RNG, coleção)
```

---

## Tecnologias

- **Vite 5** — bundler e servidor de desenvolvimento
- **Vitest + jsdom** — testes unitários
- **CSS puro** — animações 3D, layout responsivo, sem frameworks

---

## Licença

MIT
