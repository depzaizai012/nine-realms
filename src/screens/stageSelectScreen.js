import { getRealmStages } from "../data/stages/stageSelect.js";
import { getStageBattleBackground } from "../data/assets/manifest.js";
import { STAGES } from "../data/stages/index.js";
import { loadProgress, stageProgress } from "../core/progression/gameSaveService.js";
import "../styles/stage-select.css";

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

export function mountStageSelect(app, navigation = {}, realmId = "VERDANT_REALM") {
  const stages = getRealmStages(realmId);
  const progress = loadProgress();
  const lifecycle = new AbortController();
  let selectedId = stages.find((stage) => stageProgress(progress, stage.id).unlocked)?.id
    ?? stages[0]?.id;
  const completed = stages.filter((stage) => stageProgress(progress, stage.id).cleared).length;
  const stars = stages.reduce((total, stage) => total + stageProgress(progress, stage.id).stars, 0);
  const forest = getStageBattleBackground(STAGES["1-1"]);

  const status = (stage) => {
    const state = stageProgress(progress, stage.id);
    if (!state.unlocked && !state.cleared) return "locked";
    if (!stage.playable) return "coming-soon";
    return state.cleared ? "cleared" : "available";
  };
  const symbol = (stage) => {
    const state = status(stage);
    if (state === "locked") return "♢";
    if (state === "coming-soon") return "⌛";
    if (stage.tier === "BOSS") return "♛";
    return state === "cleared" ? "✦" : "⚔";
  };
  const points = stages.map((stage) => {
    const state = stageProgress(progress, stage.id);
    return `<button type="button" class="stage-node ${status(stage)} ${stage.tier.toLowerCase()}"
      data-stage-id="${esc(stage.id)}" style="--stage-row:${stage.row + 1};--stage-col:${stage.column}"
      aria-label="Stage ${esc(stage.id)}: ${esc(stage.title)}"
      aria-pressed="${stage.id === selectedId}">
      <span class="stage-node-halo" aria-hidden="true"></span>
      <span class="stage-node-emblem" aria-hidden="true">${symbol(stage)}</span>
      <strong>${esc(stage.id)}</strong>
      <span class="stage-node-stars" aria-label="${state.stars} stars">${"★".repeat(state.stars)}${"☆".repeat(3 - state.stars)}</span>
    </button>`;
  }).join("");

  app.innerHTML = `<main class="game stage-select-screen" aria-label="Stage selection">
    <div class="stage-map-art" style="background-image:url('${forest}')" aria-hidden="true"></div>
    <div class="stage-map-shade" aria-hidden="true"></div>
    <header class="stage-select-header">
      <button class="stage-back" type="button" aria-label="Back to town">‹</button>
      <div class="stage-select-heading">
        <span>CHAPTER I · REALM OF WOOD</span>
        <h1>Verdant Realm</h1>
      </div>
      <span class="stage-realm-icon" aria-hidden="true">✥</span>
    </header>
    <section class="stage-map-intro">
      <p class="stage-map-eyebrow">THE CORRUPTED WILDS</p>
      <h2>The Whispering Path</h2>
      <p>Follow the ancient trail to restore the forest.</p>
      <div class="stage-progress-meta"><span>${completed}/10 cleared</span><span>${stars}/30 ★</span></div>
    </section>
    <section class="stage-map-scene" aria-label="Verdant Realm stages">
      <div class="stage-route-map">
        <svg class="stage-route-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path class="stage-trail-shadow" d="M25 90 L75 90 L75 70 L25 70 L25 50 L75 50 L75 30 L25 30 L25 10 L75 10"/>
          <path class="stage-trail-ink" d="M25 90 L75 90 L75 70 L25 70 L25 50 L75 50 L75 30 L25 30 L25 10 L75 10"/>
        </svg>
        ${points}
      </div>
    </section>
    <section class="stage-details" aria-label="Selected stage details" aria-live="polite">
      <div class="stage-details-top"><span class="stage-details-kicker"></span><span class="stage-details-badge"></span></div>
      <h2 class="stage-details-title"></h2>
      <p class="stage-details-description"></p>
      <div class="stage-details-actions">
        <span class="stage-details-stars"></span>
        <button type="button" class="stage-play-button" disabled>LOCKED</button>
      </div>
    </section>
    <div class="stage-safe-bottom" aria-hidden="true"></div>
  </main>`;

  const root = app.querySelector(".stage-select-screen");
  const renderSelected = () => {
    const stage = stages.find((entry) => entry.id === selectedId);
    if (!stage) return;
    const state = status(stage);
    const saved = stageProgress(progress, selectedId);
    root.querySelectorAll(".stage-node").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.stageId === selectedId));
    });
    root.querySelector(".stage-details-kicker").textContent =
      `STAGE ${stage.id}${stage.tier === "BOSS" ? " · BOSS" : stage.tier === "ELITE" ? " · ELITE" : ""}`;
    root.querySelector(".stage-details-title").textContent = stage.title;
    const badge = root.querySelector(".stage-details-badge");
    badge.dataset.status = state;
    badge.textContent = {
      locked: "LOCKED", "coming-soon": "COMING SOON",
      available: "AVAILABLE", cleared: "CLEARED",
    }[state];
    root.querySelector(".stage-details-description").textContent =
      state === "locked"
        ? "Clear the previous stage to unlock this path."
        : state === "coming-soon"
          ? "This path is revealed, but its battle is still in development."
          : state === "cleared"
            ? "The path is restored. Replay this battle to improve your result."
            : "The first battle awaits. Rally your heroes and enter the wilds.";
    root.querySelector(".stage-details-stars").textContent =
      `★ ${saved.stars}/3${saved.bestTurns === null ? "" : ` · Best: ${saved.bestTurns} turns`}`;
    const play = root.querySelector(".stage-play-button");
    play.disabled = state !== "available" && state !== "cleared";
    play.textContent = state === "available" ? "BEGIN BATTLE" :
      state === "cleared" ? "REPLAY BATTLE" : state === "coming-soon" ? "COMING SOON" : "LOCKED";
  };
  renderSelected();
  root.addEventListener("click", (event) => {
    const stageButton = event.target.closest(".stage-node");
    if (stageButton) {
      selectedId = stageButton.dataset.stageId;
      renderSelected();
      return;
    }
    if (event.target.closest(".stage-back")) navigation.onBack?.();
    if (event.target.closest(".stage-play-button")) {
      const chosen = stages.find((entry) => entry.id === selectedId);
      if (chosen?.playable && stageProgress(progress, chosen.id).unlocked)
        navigation.onBattle?.(chosen.id);
    }
  }, { signal: lifecycle.signal });

  return {
    destroy() {
      lifecycle.abort();
      root.remove();
    },
  };
}
