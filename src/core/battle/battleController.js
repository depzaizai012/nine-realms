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
  const canInput = () =>
    state.phase === "idle" &&
    !state.paused &&
    !state.disposed &&
    !state.activeBattleOverlay;
  const ensureActive = () => {
    if (state.disposed) throw new DOMException("Battle disposed", "AbortError");
  };
  const render = () => {
    if (state.disposed) return;
    const target = selectedEnemy(state);
    if (target) state.selected = target.uid;
    view.render(state);
  };
  async function present(event) {
    if (!event) return;
    if (event.kind === "damage") await vfx.attack(event, render);
    else await vfx.hit(view.actor(event.target), event);
    ensureActive();
    render();
    if (event.dead && state.enemies.some((e) => e.uid === event.target))
      await vfx.death(event.target);
  }
  async function ensureMoves() {
    if (!validMoves(state.board).length) {
      const before = state.board;
      state.board = shuffle(state.board, rng);
      view.message("The board shifts…");
      view.board.render(state.board);
      await vfx.fall(before, state.board);
    }
  }
  async function finish() {
    ensureActive();
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
    ensureActive();
    state.phase = "idle";
    render();
  }
  async function enemyPhase() {
    await vfx.wait(0);
    state.phase = "enemy";
    for (const enemy of state.enemies.filter((e) => e.hp > 0)) {
      for (
        let i = 0;
        i < (enemy.multiAttack ? enemy.attackCount || 2 : 1);
        i++
      ) {
        await vfx.wait(0);
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
    view.dismissMessage?.();
    state.phase = "swap";
    const valid = isValidSwap(state.board, a, b);
    await vfx.swap(a, b);
    ensureActive();
    state.board = swapped(state.board, a, b);
    view.board.render(state.board);
    if (!valid) {
      await vfx.swap(a, b);
      ensureActive();
      state.board = swapped(state.board, a, b);
      view.board.render(state.board);
      state.phase = "idle";
      return false;
    }
    state.turn++;
    const resolveResult = {
      totalClearedByElement: Object.fromEntries(
        ["WOOD", "FIRE", "WATER", "EARTH", "LIGHT", "DARK"].map((e) => [e, 0]),
      ),
      matchedGroups: [],
      cascadesCount: 0,
      totalTilesCleared: 0,
      specialTriggered: [],
      hazardsResolved: [],
      attacks: [],
    };
    let swap = [b, a];
    for (let cascade = 0; ; cascade++) {
      const step = resolveStep(state.board, { swap });
      swap = null;
      if (!step.clear.length) break;
      state.phase = "resolving";
      await vfx.clear(step);
      ensureActive();
      const before = state.board;
      state.board = fallAndRefill(state.board, step, rng);
      view.board.render(state.board);
      await vfx.fall(before, state.board);
      ensureActive();
      resolveResult.cascadesCount = cascade;
      resolveResult.matchedGroups.push(
        ...step.groups.map((g) => ({ ...g, cascadeIndex: cascade })),
      );
      resolveResult.specialTriggered.push(
        ...step.activations.map((a) => ({ ...a, cascadeIndex: cascade })),
      );
      resolveResult.attacks.push(
        ...step.attacks.map((a) => ({ ...a, cascadeIndex: cascade })),
      );
      for (const index of step.clear) {
        const tile = before[index];
        resolveResult.totalTilesCleared++;
        resolveResult.totalClearedByElement[tile.element]++;
        if (tile.hazardType)
          resolveResult.hazardsResolved.push({
            id: tile.id,
            index,
            type: tile.hazardType,
            cascadeIndex: cascade,
          });
      }
    }
    state.resolveResult = resolveResult;
    state.phase = "hero";
    for (const match of resolveResult.attacks) {
      await vfx.wait(0);
      const event = heroAttack(state, match);
      if (!event) continue;
      await present(event);
      await vfx.wait(T.heroGap);
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
    view.dismissMessage?.();
    let events = [];
    await vfx.ultimate(hero, async () => {
      events = ultimate(state, hero);
      return vfx.ultimateImpact(events, render);
    });
    ensureActive();
    for (const event of events)
      if (event.dead && state.enemies.some((e) => e.uid === event.target))
        await vfx.death(event.target);
    render();
    await finish();
  }
  function select(id) {
    if (!canInput()) return false;
    if (state.enemies.some((e) => e.uid === id && e.hp > 0)) {
      state.selected = id;
      render();
    }
  }
  const cancellable =
    (fn) =>
    async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        if (state.disposed && error.name === "AbortError") return false;
        throw error;
      }
    };
  return {
    move: cancellable(move),
    useUltimate: cancellable(useUltimate),
    select,
    canInput,
    ensureMoves,
    render,
  };
}
