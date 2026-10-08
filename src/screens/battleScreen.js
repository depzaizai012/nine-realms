import { STAGES } from "../data/stages/index.js";
import {
  getBattleBackground,
  getRealmBoardFrame,
  getEnemyAsset,
  getRealmIcon,
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
export function mountBattle(app, stageId = "1-1") {
  const stage = STAGES[stageId],
    state = createBattle(stage);
  let controller, messageTimer;
  app.innerHTML = `<main class="game" aria-label="Legend of the Nine Realms">
    <div class="visual-root">
      <header class="top-hud">
        <img class="realm-icon" src="${getRealmIcon(stage.realm)}" alt="${REALMS.find((r) => r.id === stage.realm)?.name}">
        <div class="stage-label"><span>STAGE ${stage.id}</span><h1>${stage.name}</h1></div>
        <div class="wave-label"><span>WAVE</span><b id="wave">1 / ${stage.waves.length}</b></div>
        <button class="auto-control" disabled aria-pressed="false" aria-label="Auto battle off, coming soon" title="Auto Battle is coming soon"><span>AUTO</span><small>OFF</small></button>
        <button class="pause" aria-label="Pause battle">Ⅱ</button>
      </header>
      <section class="combat" style="background-image:url('${getBattleBackground(stage.background)}')">
        <div class="enemy-hud"><img class="enemy-icon" alt=""><div><div class="enemy-heading"><b class="enemy-name"></b><span class="enemy-hp-text"></span></div><div class="bar enemy-hp"><i class="trail"></i><i class="fill"></i></div></div></div>
        <div class="location">${REALMS.find((r) => r.id === stage.realm)?.name.toUpperCase()} <span>•</span> ${stage.subtitle}</div>
        <div class="enemy-field"></div><div class="combat-vignette"></div>
      </section>
      <section class="party" aria-label="Heroes"></section>
      <section class="board-shell"><img class="board-frame" src="${getRealmBoardFrame(stage.realm)}" alt=""><div class="board" role="grid" aria-label="Match three board"></div><div class="board-vfx-layer" aria-hidden="true"></div></section>
      <footer><span>NINE REALMS</span><span>Swipe to match · Tap a hero for an ultimate</span></footer>
    </div>
    <div class="vfx-layer" aria-hidden="true"></div><div class="number-layer" aria-hidden="true"></div><div class="toast" role="status"></div>
    <dialog class="pause-dialog"><div class="dialog-mark">✦</div><p>NINE REALMS</p><h2>A moment of stillness</h2><p>Your journey will be here.</p><button class="resume primary">Resume journey</button><button class="restart">Restart stage</button></dialog><dialog class="result-dialog"></dialog>
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
      heroes.render(s.heroes);
      enemies.render(s);
      root.querySelector("#wave").textContent =
        `${s.wave + 1} / ${s.stage.waves.length}`;
      const enemy = s.enemies.find((e) => e.uid === s.selected);
      if (enemy) {
        root.querySelector(".enemy-icon").src = getEnemyAsset(
          enemy.assetId,
          "idle",
        );
        root.querySelector(".enemy-name").textContent =
          `${enemy.elite ? "ELITE " : ""}${enemy.name}`;
        root.querySelector(".enemy-hp-text").textContent =
          `${enemy.hp} / ${enemy.maxHp}`;
        for (const el of root.querySelectorAll(".enemy-hp i"))
          el.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
      }
    },
    result(won, s) {
      const dialog = root.querySelector(".result-dialog");
      dialog.innerHTML = `<div class="dialog-mark">${won ? "✦" : "◇"}</div><p>STAGE ${s.stage.id} · ${s.stage.name}</p><h2>${won ? "The canopy awakens" : "The grove remembers"}</h2><p>${won ? "Victory · All three waves cleared" : "Your heroes have fallen. Try a new path."}</p><p>${s.turn} turns · ${s.heroes.filter((h) => h.hp > 0).length} heroes standing</p><button class="primary">Play again</button>`;
      dialog.querySelector("button").onclick = () => location.reload();
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
  attachInput(root.querySelector(".board"), {
    ...controller,
    swap: controller.move,
    interact: hints.reset,
  });
  root.addEventListener("pointerdown", hints.reset);
  const pause = root.querySelector(".pause-dialog");
  root.querySelector(".pause").onclick = () => {
    state.paused = true;
    pause.showModal();
  };
  const resume = () => {
    state.paused = false;
    pause.close();
    hints.reset();
  };
  root.querySelector(".resume").onclick = resume;
  root.querySelector(".restart").onclick = () => location.reload();
  pause.addEventListener("cancel", (e) => {
    e.preventDefault();
    resume();
  });
  message("Swipe adjacent gems to match three");
  if (import.meta.env.DEV)
    window.__battle = { state, controller, view, vfx, hints, auto };
  return { state, controller, auto };
}
