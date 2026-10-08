import { AUTO_BATTLE_CONFIG } from "../../data/autoBattleConfig.js";
import { MATCH_CONFIG } from "../../data/boardConfig.js";
import { validMoves } from "../match3/engine.js";
// No scheduler or AI policy yet. Future automation uses the same controller APIs.
export function createAutoBattleAdapter(state, controller) {
  state.autoBattleEnabled = AUTO_BATTLE_CONFIG.defaultEnabled;
  return {
    config: AUTO_BATTLE_CONFIG,
    get enabled() {
      return state.autoBattleEnabled;
    },
    setEnabled(value) {
      state.autoBattleEnabled = !!value && AUTO_BATTLE_CONFIG.available;
      return state.autoBattleEnabled;
    },
    canRun() {
      return (
        AUTO_BATTLE_CONFIG.available &&
        state.autoBattleEnabled &&
        controller.canInput()
      );
    },
    getLegalMoves() {
      return validMoves(state.board).map((cells) => ({
        cells,
        specialTypes: cells
          .map((i) => state.board[i].specialType)
          .filter(Boolean),
      }));
    },
    getTargets() {
      return state.enemies
        .filter((e) => e.hp > 0)
        .map((e) => ({
          id: e.uid,
          hpRatio: e.hp / e.maxHp,
          priority: e.targetPriority || 0,
          support: ["HEALER", "SUPPORT"].includes(e.role),
          marked: !!e.marked,
          boss: !!e.isBoss,
          current: e.uid === state.selected,
        }));
    },
    getReadyUltimates() {
      return state.heroes
        .filter((h) => h.hp > 0 && h.energy >= MATCH_CONFIG.maxEnergy)
        .map((h) => h.id);
    },
    move: controller.move,
    select: controller.select,
    useUltimate: controller.useUltimate,
  };
}
