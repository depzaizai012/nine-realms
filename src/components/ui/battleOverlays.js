import { getHudAsset, getGemBaseAsset } from "../../data/assets/manifest.js";
import { ELEMENTAL_MATCHUPS } from "../../data/elementalMatchups.js";
export function createBattleOverlays(
  root,
  state,
  { clock, onReplay, onTown, onInteraction, onControls },
  signal,
) {
  const dialog = document.createElement("dialog");
  dialog.className = "battle-overlay-dialog";
  root.append(dialog);
  let closing = null,
    revision = 0,
    finishClose = null;
  const panelAsset = (key) => {
    const url = getHudAsset(key);
    return url
      ? `<img class="overlay-art" data-hud-asset="${key}" src="${url}" alt="">`
      : "";
  };
  function render(kind) {
    dialog.classList.remove("closing");
    dialog.dataset.kind = kind;
    const pause = kind === "PAUSE";
    dialog.innerHTML = `<section class="overlay-panel ${pause ? "pause-panel" : "element-panel"}" aria-label="${pause ? "Paused" : "Elemental advantage"}">${panelAsset(pause ? "BTN_BATTLE_PAUSE_MENU_BG" : "PANEL_ELEMENTAL_ADVANTAGE_BG")}${pause ? '<h2>PAUSED</h2><button class="replay">REPLAY</button><button class="back-town">BACK TO TOWN</button>' : `<h2>ELEMENTAL ADVANTAGE</h2><div class="element-panel-content"><div class="element-icons">${ELEMENTAL_MATCHUPS.elements.map((e) => `<div><img src="${getGemBaseAsset(e)}" alt="${e}"><span>${e}</span></div>`).join("")}</div><p>All elements currently deal neutral damage.</p><p class="element-rule-note">No elemental bonus is applied in this build.</p></div>`}</section>`;
    const panel = dialog.querySelector(".overlay-panel");
    if (
      !pause &&
      ELEMENTAL_MATCHUPS.enabled &&
      ELEMENTAL_MATCHUPS.advantages.length
    ) {
      const content = panel.querySelector(".element-panel-content");
      content.innerHTML = ELEMENTAL_MATCHUPS.advantages
        .map(
          (rule) =>
            `<div class="advantage-rule"><img src="${getGemBaseAsset(rule.attacker)}" alt="${rule.attacker}"><span>→</span><img src="${getGemBaseAsset(rule.target)}" alt="${rule.target}"><b>×${rule.multiplier}</b></div>`,
        )
        .join("");
    }
    if (!panel.querySelector(".overlay-art"))
      panel.classList.add("ui-panel-fallback");
    if (pause) {
      dialog.querySelector(".replay").onclick = onReplay;
      dialog.querySelector(".back-town").onclick = onTown;
    }
  }
  function open(kind) {
    if (state.disposed) return;
    revision++;
    finishClose?.();
    if (dialog.open) {
      dialog.close();
    }
    closing = null;
    state.activeBattleOverlay = kind;
    clock.pause(true);
    onInteraction();
    render(kind);
    dialog.showModal();
    onControls();
  }
  async function close() {
    if (!dialog.open) return;
    if (closing) return closing;
    const token = revision;
    dialog.classList.add("closing");
    closing = new Promise((resolve) => {
      const panel = dialog.querySelector(".overlay-panel");
      if (matchMedia("(prefers-reduced-motion: reduce)").matches)
        return resolve();
      const done = () => {
        panel.removeEventListener("animationend", ended);
        signal.removeEventListener("abort", done);
        finishClose = null;
        resolve();
      };
      const ended = (e) => {
        if (e.target === panel && e.animationName === "battle-panel-exit")
          done();
      };
      finishClose = done;
      panel.addEventListener("animationend", ended);
      signal.addEventListener("abort", done, { once: true });
    });
    await closing;
    if (state.disposed || token !== revision) return;
    dialog.close();
    dialog.classList.remove("closing");
    state.activeBattleOverlay = null;
    clock.pause(false);
    closing = null;
    onControls();
    onInteraction();
  }
  dialog.addEventListener(
    "pointerdown",
    (e) => {
      if (e.target.closest(".overlay-panel")) {
        e.stopPropagation();
        return;
      }
      if (e.target === dialog) close();
    },
    { signal },
  );
  dialog.addEventListener(
    "cancel",
    (e) => {
      e.preventDefault();
      close();
    },
    { signal },
  );
  return {
    openElementHelp: () => open("ELEMENT_HELP"),
    openPauseMenu: () => open("PAUSE"),
    closeBattleOverlay: close,
    dialog,
    destroy() {
      revision++;
      finishClose?.();
      if (dialog.open) dialog.close();
      dialog.remove();
    },
  };
}
