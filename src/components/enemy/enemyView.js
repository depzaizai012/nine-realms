import {
  getBattlerAsset,
  getBattlerAssetKey,
  getStatusIconAsset,
} from "../../data/assets/manifest.js";
import { getEnemyTier } from "./enemyTier.js";
import {
  ENEMY_PRESENTATION,
  getSpritePlacement,
} from "../../data/enemyPresentation.js";
import { getHeroStatuses, getStatusSlots } from "../hero/heroHudState.js";
import "../../styles/enemy-presentation.css";
export function createEnemyView(root, onSelect) {
  root.classList.add("grounded-enemies");
  return {
    spawn(enemies) {
      root.replaceChildren();
      for (const [index, e] of enemies.entries()) {
        const el = document.createElement("button");
        el.className = "enemy" + (e.elite ? " elite" : "");
        el.dataset.actor = e.uid;
        el.setAttribute(
          "aria-label",
          `Target ${e.elite ? "Elite " : ""}${e.name}`,
        );
        const r = e.render || {};
        const tier = getEnemyTier(e),
          theme = ENEMY_PRESENTATION[tier];
        el.dataset.tier = tier;
        el.style.setProperty("--enemy-tier-scale", theme.scale);
        el.style.setProperty("--ring-color", theme.ring);
        el.style.setProperty("--ring-glow", theme.glow);
        el.style.setProperty("--idle-phase", `${-index * 2.3}s`);
        el.style.setProperty("--breathing-duration", `${6.5 + index * 0.3}s`);
        el.innerHTML = `<span class="contact-shadow"></span><span class="target-ring"></span><span class="enemy-ground-anchor"><span class="enemy-idle-wrapper"><span class="enemy-drift-wrapper"><span class="enemy-action-wrapper">${[
          "idle",
          "attack",
        ]
          .map((mode) => {
            const p = getSpritePlacement(getBattlerAssetKey(e, mode), {
              scale: r[mode + "Scale"] || 1,
              x: r[mode + "OffsetX"] || 0,
              y: r[mode + "OffsetY"] || 0,
            });
            return `<img class="enemy-sprite sprite-${mode}" src="${getBattlerAsset(e, mode)}" alt="${mode === "idle" ? e.name : ""}" draggable="false" style="transform:translate(${p.x}%,${p.y}%) scale(${p.scale});transform-origin:50% 100%">`;
          })
          .join(
            "",
          )}</span></span></span></span><span class="enemy-vfx-layer"></span>`;
        el.onclick = () => onSelect(e.uid);
        if (getEnemyTier(e) !== "BOSS") {
          const hud = document.createElement("span");
          hud.className = "enemy-local-hud";
          hud.innerHTML =
            '<span class="enemy-local-status-icons"></span><span class="enemy-local-bar"><i></i></span><span class="enemy-local-mana" hidden><i></i></span>';
          el.append(hud);
        }
        root.append(el);
      }
    },
    render(state) {
      for (const el of root.children) {
        el.classList.toggle("selected", el.dataset.actor === state.selected);
        const enemy = state.enemies.find((e) => e.uid === el.dataset.actor),
          fill = el.querySelector(".enemy-local-bar i");
        if (fill && enemy)
          fill.style.width = `${Math.max(0, enemy.hp / enemy.maxHp) * 100}%`;
        if (enemy && fill) {
          const mana = el.querySelector(".enemy-local-mana"),
            max = enemy.maxMana ?? enemy.maxEnergy ?? 0;
          mana.hidden = getEnemyTier(enemy) !== "ELITE" || !max;
          if (!mana.hidden)
            mana.firstChild.style.width = `${Math.min(1, (enemy.mana ?? enemy.energy ?? 0) / max) * 100}%`;
          const slot = el.querySelector(".enemy-local-status-icons");
          const { visible, overflowCount } = getStatusSlots(
            getHeroStatuses({
              ...enemy,
              modifiers: {
                ...enemy.modifiers,
                debuff: enemy.debuff ?? enemy.modifiers?.debuff,
              },
            }),
          );
          const signature = JSON.stringify([
            visible.map((s) => [s.id, s.type, s.stacks, s.durationTurns]),
            overflowCount,
          ]);
          if (slot.dataset.signature !== signature) {
            slot.dataset.signature = signature;
            slot.replaceChildren();
            for (const status of visible) {
              const icon = document.createElement("span");
              icon.className = `enemy-status-icon status-${status.tone}`;
              icon.title = status.name;
              const url = getStatusIconAsset(status);
              if (url) {
                const img = document.createElement("img");
                img.src = url;
                img.alt = status.name;
                icon.append(img);
              } else icon.innerHTML = status.iconSvg;
              slot.append(icon);
            }
            if (overflowCount) {
              const icon = document.createElement("span");
              icon.className = "enemy-status-icon";
              icon.textContent = `+${overflowCount}`;
              slot.append(icon);
            }
          }
        }
      }
    },
  };
}
