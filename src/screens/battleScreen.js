import { STAGES } from "../data/stages/index.js";
import {
  getBattleBackground,
  getRealmBoardFrame,
  getEnemyAsset,
  getRealmIcon,
  getStageBattleBackground,
  getGemBaseAsset,
} from "../data/assets/manifest.js";
import { REALMS } from "../data/realms/index.js";
import {
  BOARD_THEMES,
  DEFAULT_BOARD_THEME,
} from "../data/boardThemes/index.js";
import { createBattle } from "../core/battle/battleStore.js";
import { createBattleController } from "../core/battle/battleController.js";
import { createBoardView } from "../components/board/boardView.js";
import { createHeroView } from "../components/hero/heroView.js";
import { createEnemyView } from "../components/enemy/enemyView.js";
import { createVfx } from "../core/vfx/battleVfxController.js";
import { attachInput } from "../core/match3/inputController.js";
import { createHints } from "../core/match3/hintController.js";
import { createAutoBattleAdapter } from "../core/battle/autoBattleAdapter.js";
import { createBattleControls } from "../components/ui/battleControls.js";
import { createBattleOverlays } from "../components/ui/battleOverlays.js";
import { getEnemyTier } from "../components/enemy/enemyTier.js";
import "../styles/battle-controls.css";
import { resolveBattleBackground } from "../data/battleBackgroundRules.js";
export function mountBattle(app, stageId = "1-1", navigation = {}) {
  const stage = STAGES[stageId],
    state = createBattle(stage);
  let controller, messageTimer, controls;
  const lifecycle = new AbortController();
  app.innerHTML = `<main class="game" aria-label="Legend of the Nine Realms">
    <div class="visual-root">
      <header class="top-hud">
        <button class="help battle-control" aria-label="Elemental advantage">!</button>
        <div class="stage-label"><span>STAGE ${stage.id}</span><h1>${stage.name}</h1></div>
        <div class="wave-label"><span>WAVE</span><b id="wave">1 / ${stage.waves.length}</b></div>
        <button class="speed battle-control" aria-label="Toggle double speed" aria-pressed="false">×2</button>
        <button class="pause battle-control" aria-label="Pause battle">Ⅱ</button>
      </header>
      <section class="combat" style="background-image:url('${getStageBattleBackground(stage)}')">
        <div class="enemy-hud"><img class="enemy-icon" alt=""><div><span class="boss-stage-info"></span><div class="enemy-heading"><b class="enemy-name"></b><span class="enemy-hp-text"></span></div><div class="bar enemy-hp"><i class="trail"></i><i class="fill"></i></div><div class="boss-mana" hidden><i></i></div></div></div>
        <div class="location">${REALMS.find((r) => r.id === stage.realm)?.name.toUpperCase()} <span>•</span> ${stage.subtitle}</div>
        <div class="enemy-field"></div><div class="combat-vignette"></div>
      </section>
      <section class="party" aria-label="Heroes"></section>
      <section class="board-shell"><img class="board-frame" src="${getRealmBoardFrame(stage.realm)}" alt=""><div class="board" role="grid" aria-label="Match three board"></div><div class="board-vfx-layer" aria-hidden="true"></div></section>
    </div>
    <div class="vfx-layer" aria-hidden="true"></div><div class="number-layer" aria-hidden="true"></div><div class="toast" role="status"></div>
    <dialog class="result-dialog"></dialog>
  </main>`;
  const theme = BOARD_THEMES[stage.realm] || DEFAULT_BOARD_THEME;
  const boardRoot = app.querySelector(".board");
  for (const [key, value] of Object.entries(theme.inner))
    boardRoot.style.setProperty(key, `${value}%`);
  const root = app.querySelector(".game"),
    board = createBoardView(root.querySelector(".board")),
    heroes = createHeroView(root.querySelector(".party"), state.heroes, (id) =>
      controller.useUltimate(id),
    ),
    enemies = createEnemyView(root.querySelector(".enemy-field"), (id) =>
      controller.select(id),
    );
  const actor = (id) => root.querySelector(`[data-actor="${id}"]`);
  function message(text) {
    const toast = root.querySelector(".toast");
    toast.textContent = text;
    toast.classList.add("visible");
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
  }
  const view = {
    board,
    enemies,
    actor,
    message,
    dismissMessage() {
      clearTimeout(messageTimer);
      root.querySelector(".toast").classList.remove("visible");
    },
    render(s) {
      const background = resolveBattleBackground(s.stage),
        combat = root.querySelector(".combat");
      if (combat.dataset.backgroundKey !== background.assetKey) {
        combat.dataset.backgroundKey = background.assetKey;
        combat.dataset.backgroundTier = background.tier;
        combat.style.backgroundImage = `url('${getStageBattleBackground(s.stage)}')`;
        combat.style.setProperty(
          "--ground-bottom",
          `${background.groundBottomPercent}%`,
        );
      }
      heroes.render(s.heroes);
      enemies.render(s);
      root.querySelector("#wave").textContent =
        `${s.wave + 1} / ${s.stage.waves.length}`;
      const enemy = s.enemies.find(
        (e) => getEnemyTier(e) === "BOSS" && e.hp > 0,
      );
      root.querySelector(".enemy-hud").hidden = !enemy;
      if (enemy) {
        root.querySelector(".enemy-icon").src = getGemBaseAsset(enemy.element);
        root.querySelector(".enemy-icon").alt = enemy.element;
        root.querySelector(".boss-stage-info").textContent =
          `STAGE ${s.stage.id} · ${s.stage.name} · WAVE ${s.wave + 1}/${s.stage.waves.length}`;
        root.querySelector(".enemy-name").textContent =
          `${enemy.elite ? "ELITE " : ""}${enemy.name}`;
        root.querySelector(".enemy-hp-text").textContent =
          `${enemy.hp} / ${enemy.maxHp}`;
        for (const el of root.querySelectorAll(".enemy-hp i"))
          el.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
        const mana = root.querySelector(".boss-mana"),
          max = enemy.maxMana ?? enemy.maxEnergy ?? 0;
        mana.hidden = !max;
        if (max)
          mana.firstChild.style.width = `${Math.min(1, (enemy.mana ?? enemy.energy ?? 0) / max) * 100}%`;
      }
    },
    result(won, s) {
      if (won) navigation.onVictory?.({
        turns: s.turn,
        heroesStanding: s.heroes.filter((hero) => hero.hp > 0).length,
      });
      const dialog = root.querySelector(".result-dialog");
      dialog.innerHTML = `<div class="dialog-mark">${won ? "✦" : "◇"}</div><p>STAGE ${s.stage.id} · ${s.stage.name}</p><h2>${won ? "The canopy awakens" : "The grove remembers"}</h2><p>${won ? "Victory · All three waves cleared" : "Your heroes have fallen. Try a new path."}</p><p>${s.turn} turns · ${s.heroes.filter((h) => h.hp > 0).length} heroes standing</p><button class="primary">Play again</button><button class="stage-map-button">Stage Select</button>`;
      dialog.querySelector(".primary").onclick = () => navigation.onReplay?.();
      dialog.querySelector(".stage-map-button").onclick = () => navigation.onStageSelect?.();
      dialog.showModal();
    },
  };
  const vfx = createVfx(root, state, board);
  controller = createBattleController(state, view, vfx);
  const auto = createAutoBattleAdapter(state, controller);
  board.render(state.board);
  enemies.spawn(state.enemies);
  controller.render();
  const hints = createHints(state, board);
  const input = attachInput(
    root.querySelector(".board"),
    {
      ...controller,
      swap: controller.move,
      interact: hints.reset,
    },
    lifecycle.signal,
  );
  root.addEventListener("pointerdown", hints.reset, {
    signal: lifecycle.signal,
  });
  const destroy = () => {
    if (state.disposed) return;
    input.cancel();
    hints.destroy();
    clearTimeout(messageTimer);
    lifecycle.abort();
    vfx.dispose();
    overlays.destroy();
    root.remove();
  };
  const overlays = createBattleOverlays(
    root,
    state,
    {
      clock: vfx.clock,
      onReplay: () => {
        if (navigation.onReplay) navigation.onReplay();
        else {
          destroy();
          mountBattle(app, stageId, navigation);
        }
      },
      onTown: () => navigation.onTown?.(),
      onInteraction: () => {
        input.cancel();
        hints.reset();
        view.dismissMessage();
      },
      onControls: () => controls?.render(),
    },
    lifecycle.signal,
  );
  controls = createBattleControls(root, state, vfx.clock, overlays);
  message("Swipe adjacent gems to match three");
  if (import.meta.env.DEV)
    window.__battle = {
      state,
      controller,
      view,
      vfx,
      hints,
      auto,
      overlays,
      controls,
      destroy,
    };
  return { state, controller, auto, destroy };
}
