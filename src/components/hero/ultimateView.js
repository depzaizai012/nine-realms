import { loadHeroUltimateAsset } from "../../data/assets/manifest.js";
export async function createUltimateView(root, hero) {
  const asset = await loadHeroUltimateAsset(hero.assetId);
  const layer = document.createElement("div");
  layer.className = "ultimate-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.dataset.hero = hero.id;
  layer.dataset.assetType = asset.type;
  layer.innerHTML =
    '<div class="ultimate-shade"></div><div class="ultimate-aura"></div><img class="ultimate-art" alt=""><div class="ultimate-title"><span>ULTIMATE</span><strong></strong></div>';
  const art = layer.querySelector(".ultimate-art");
  art.src = asset.url;
  art.dataset.assetType = asset.type;
  layer.querySelector(".ultimate-title strong").textContent =
    hero.ultimateName || `${hero.name} · Ultimate`;
  const gameRect = root.getBoundingClientRect(),
    combatRect = root.querySelector(".combat").getBoundingClientRect(),
    partyRect = root.querySelector(".party").getBoundingClientRect();
  layer.style.top = `${combatRect.top - gameRect.top}px`;
  layer.style.height = `${partyRect.bottom - combatRect.top}px`;
  root.append(layer);
  return {
    layer,
    art,
    title: layer.querySelector(".ultimate-title"),
    aura: layer.querySelector(".ultimate-aura"),
    destroy: () => layer.remove(),
  };
}
