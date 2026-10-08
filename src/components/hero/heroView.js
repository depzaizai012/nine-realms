import { getHeroAsset, getGemBaseAsset } from "../../data/assets/manifest.js";
import { MATCH_CONFIG } from "../../data/boardConfig.js";
export function createHeroView(root, heroes, onUltimate) {
  const cards = new Map();
  for (const h of heroes) {
    const el = document.createElement("button");
    el.className = "hero-card";
    el.dataset.actor = h.id;
    el.innerHTML = `<div class="avatar-wrap"><img class="avatar" src="${getHeroAsset(h.assetId, "avatar")}" alt="${h.name}"><img class="element" src="${getGemBaseAsset(h.element)}" alt="${h.element}"></div><b>${h.name}</b><span class="hp-text"></span><div class="bar hp"><i class="trail"></i><i class="fill"></i></div><div class="bar energy"><i class="fill"></i></div>`;
    el.onclick = () => onUltimate(h.id);
    root.append(el);
    cards.set(h.id, el);
  }
  return {
    render(heroes) {
      for (const h of heroes) {
        const el = cards.get(h.id);
        el.classList.toggle("dead", h.hp <= 0);
        el.classList.toggle(
          "charged",
          h.hp > 0 && h.energy >= MATCH_CONFIG.maxEnergy,
        );
        el.querySelector(".hp-text").textContent = `${h.hp} / ${h.stats.hp}`;
        for (const fill of el.querySelectorAll(".hp i"))
          fill.style.width = `${(h.hp / h.stats.hp) * 100}%`;
        el.querySelector(".energy i").style.width =
          `${(h.energy / MATCH_CONFIG.maxEnergy) * 100}%`;
        el.setAttribute(
          "aria-label",
          `${h.name}, ${h.hp} HP, ${h.energy} energy${h.energy >= MATCH_CONFIG.maxEnergy ? ", activate ultimate" : ""}`,
        );
      }
    },
  };
}
