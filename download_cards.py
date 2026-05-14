#!/usr/bin/env python3
"""
download_cards.py — Developer setup script for Pokémon TCG 151 Booster Pack Opener.

Downloads all sv3pt5 cards from pokemontcg.io, saves each image as a .jpg into one of
7 rarity-based asset folders, and writes assets/data/cards.json.

Usage:
    python download_cards.py
    POKEMONTCG_API_KEY=your_key python download_cards.py

Idempotent: existing .jpg files and cards.json are not re-downloaded.
"""

import json
import os
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Error: 'requests' not installed. Run: pip install requests")

API_BASE = "https://api.pokemontcg.io/v2"
SET_ID   = "sv3pt5"
ASSETS   = Path("assets")

# ── Rarity → folder mapping ────────────────────────────────────────────────
RARITY_MAP = {
    "Common":                    "01_comum",
    "Uncommon":                  "02_incomum",
    "Rare":                      "03_raras",
    "Rare Holo":                 "03_raras",
    "Double Rare":               "04_duplo_raras",
    "Rare Ultra":                "04_duplo_raras",
    "Rare Holo EX":              "04_duplo_raras",
    "Rare Holo GX":              "04_duplo_raras",
    "Rare Holo V":               "04_duplo_raras",
    "Rare Holo VMAX":            "04_duplo_raras",
    "Ultra Rare":                "04_duplo_raras",
    "Illustration Rare":         "05_arte_secreta",
    "Special Illustration Rare": "06_duplo_arte_secreta",
    "Rare Rainbow":              "06_duplo_arte_secreta",
    "Rare Secret":               "06_duplo_arte_secreta",
    "Hyper Rare":                "07_legendária",
}

FOLDERS = [
    "01_comum",
    "02_incomum",
    "03_raras",
    "04_duplo_raras",
    "05_arte_secreta",
    "06_duplo_arte_secreta",
    "07_legendária",
]


def build_headers():
    api_key = os.environ.get("POKEMONTCG_API_KEY", "").strip()
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["X-Api-Key"] = api_key
        print("✓ Using POKEMONTCG_API_KEY for elevated rate limits.")
    return headers


def ensure_dirs():
    for folder in FOLDERS:
        (ASSETS / folder).mkdir(parents=True, exist_ok=True)
    (ASSETS / "data").mkdir(parents=True, exist_ok=True)


def fetch_all_cards(headers):
    """Fetch all cards for SET_ID using paginated requests."""
    print(f"Fetching cards for set '{SET_ID}'...")
    url = f"{API_BASE}/cards"
    cards, page = [], 1
    while True:
        resp = requests.get(
            url,
            params={"q": f"set.id:{SET_ID}", "pageSize": 250, "page": page},
            headers=headers,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        batch = data.get("data", [])
        cards.extend(batch)
        total = data.get("totalCount", 0)
        print(f"  {len(cards)} / {total} cards fetched...")
        if len(cards) >= total or not batch:
            break
        page += 1
    print(f"  Done — {len(cards)} cards found.\n")
    return cards


def download_image(url, dest, headers):
    """Download url → dest. Returns 'downloaded', 'skipped', or 'failed'."""
    if dest.exists():
        return "skipped"
    try:
        resp = requests.get(url, headers=headers, timeout=60)
        resp.raise_for_status()
        dest.write_bytes(resp.content)
        return "downloaded"
    except Exception as exc:
        print(f"  ⚠ Failed ({dest.name}): {exc}")
        return "failed"


def sort_key(entry):
    """Sort by numeric part of 'NNN/165', falling back to raw string."""
    num = entry.get("number", "")
    try:
        return int(num.split("/")[0])
    except ValueError:
        return float("inf")


def main():
    headers = build_headers()
    ensure_dirs()

    cards = fetch_all_cards(headers)
    print(f"Downloading images and building manifest...")

    manifest = []
    counts   = {f: 0 for f in FOLDERS}
    stats    = {"downloaded": 0, "skipped": 0, "failed": 0}
    unmapped = []

    for card in cards:
        rarity = card.get("rarity", "")
        folder = RARITY_MAP.get(rarity)

        if not folder:
            unmapped.append((card["id"], rarity))
            continue

        image_url = (
            card.get("images", {}).get("large")
            or card.get("images", {}).get("small")
        )
        if not image_url:
            print(f"  ⚠ No image URL for {card['id']} — skipping.")
            continue

        card_id  = card["id"]
        dest     = ASSETS / folder / f"{card_id}.jpg"
        result   = download_image(image_url, dest, headers)
        stats[result] += 1

        if result == "downloaded":
            print(f"  ↓ {card_id}  →  {folder}/")
            time.sleep(0.05)  # polite rate limiting

        manifest.append({
            "id":        card_id,
            "name":      card["name"],
            "number":    card.get("number", ""),
            "rarity":    rarity,
            "folder":    folder,
            "imagePath": f"assets/{folder}/{card_id}.jpg",
        })
        counts[folder] += 1

    # Sort manifest by card number then write
    manifest.sort(key=sort_key)
    manifest_path = ASSETS / "data" / "cards.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    # ── Summary ────────────────────────────────────────────────────────────
    print(f"\n{'─' * 50}")
    print(f"  ✓ Downloaded : {stats['downloaded']}")
    print(f"  ↷ Skipped    : {stats['skipped']}")
    print(f"  ✗ Failed     : {stats['failed']}")
    print(f"  Manifest     : {manifest_path}  ({len(manifest)} cards)")
    print(f"\n  Cards per folder:")
    for folder, n in counts.items():
        marker = "⚠" if n == 0 else " "
        print(f"  {marker}  {folder}: {n}")

    if unmapped:
        print(f"\n  ⚠ Unmapped rarities — these cards were skipped:")
        for cid, r in unmapped:
            print(f"     {cid}: '{r}'")
        print("  Add missing rarities to RARITY_MAP in download_cards.py if needed.")

    if stats["failed"] > 0:
        print(f"\n  ⚠ {stats['failed']} image(s) failed. Re-run the script to retry.")

    print(f"{'─' * 50}\n")
    print("  All done! Run  npm run dev  to start the game.")


if __name__ == "__main__":
    main()
