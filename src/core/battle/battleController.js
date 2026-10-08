import { MATCH_CONFIG } from "../../data/boardConfig.js";
import { swapped } from "../match3/boardUtils.js";
import {
  isValidSwap,
  resolveStep,
  fallAndRefill,
  validMoves,
  shuffle,
} from "../match3/engine.js";
import {
  heroAttack,
  enemyAttack,
  chooseHero,
  ultimate,
  selectedEnemy,
} from "./engine.js";
import { spawnWave } from "./battleStore.js";
import { VFX_CONFIG as T } from "../vfx/vfxConfig.js";
export function createBattleController(
  state,
  view,
  vfx,
  { rng = Math.random } = {},
) {
  const canInput = () => state.phase === "idle" && !state.paused;
  const render = () => {
    const target = selectedEnemy(state);
    if (target) state.selected = target.uid;
    view.render(state);
  };
  async function present(event) {
    if (!event) return;
    if (event.kind === "damage") await vfx.attack(event);
    else await vfx.hit(view.actor(event.target), event);
    render();
    if (event.dead && state.enemies.some((e) => e.uid === event.target))
      await vfx.death(event.target);
  }
  async function ensureMoves() {
    if (!validMoves(state.board).length) {
      state.board = shuffle(state.board, rng);
      view.message("The board shifts…");
      view.board.render(state.board);
      await vfx.fall();
    }
  }
  async function finish() {
    if (!state.heroes.some((h) => h.hp > 0)) {
      state.phase = "defeat";
      view.result(false, state);
      return;
    }
    if (!state.enemies.some((e) => e.hp > 0)) {
      if (state.wave === state.stage.waves.length - 1) {
        state.phase = "victory";
        view.result(true, state);
        return;
      }
      state.phase = "wave";
      view.message(`Wave ${state.wave + 2} · The journey continues`);
      await vfx.wait(T.wave);
      state.wave++;
      spawnWave(state);
      view.enemies.spawn(state.enemies);
      render();
    }
    await ensureMoves();
    state.phase = "idle";
    render();
  }
  async function enemyPhase() {
    state.phase = "enemy";
    for (const enemy of state.enemies.filter((e) => e.hp > 0)) {
      for (
        let i = 0;
        i < (enemy.multiAttack ? enemy.attackCount || 2 : 1);
        i++
      ) {
        const hero = chooseHero(state, state.lastEnemyTarget, rng);
        if (!hero) break;
        state.lastEnemyTarget = hero.id;
        await present(enemyAttack(state, enemy, hero));
        await vfx.wait(T.enemyGap);
      }
    }
  }
  async function move(a, b) {
    if (!canInput()) return false;
    state.phase = "swap";
    const valid = isValidSwap(state.board, a, b);
    await vfx.swap(a, b);
    state.board = swapped(state.board, a, b);
    view.board.render(state.board);
    if (!valid) {
      await vfx.swap(a, b);
      state.board = swapped(state.board, a, b);
      view.board.render(state.board);
      state.phase = "idle";
      return false;
    }
    state.turn++;
    let swap = [b, a];
    for (let cascade = 0; cascade < MATCH_CONFIG.maxCascades; cascade++) {
      const step = resolveStep(state.board, { swap });
      swap = null;
      if (!step.clear.length) break;
      state.phase = "resolving";
      await vfx.clear(step);
      state.board = fallAndRefill(state.board, step, rng);
      view.board.render(state.board);
      await vfx.fall();
      for (const match of step.attacks) await present(heroAttack(state, match));
      if (cascade === MATCH_CONFIG.maxCascades - 1) {
        state.board = shuffle(state.board, rng);
        view.board.render(state.board);
      }
    }
    if (state.enemies.some((e) => e.hp > 0)) await enemyPhase();
    await finish();
    return true;
  }
  async function useUltimate(id) {
    if (!canInput()) return;
    const hero = state.heroes.find((h) => h.id === id);
    if (hero.energy < MATCH_CONFIG.maxEnergy || hero.hp <= 0) {
      view.message("Match their element to charge an ultimate");
      return;
    }
    state.phase = "ultimate";
    for (const event of ultimate(state, hero)) await present(event);
    await finish();
  }
  function select(id) {
    if (state.enemies.some((e) => e.uid === id && e.hp > 0)) {
      state.selected = id;
      render();
    }
  }
  return { move, useUltimate, select, canInput, ensureMoves, render };
}
