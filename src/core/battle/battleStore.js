import { HEROES, calculateStats } from "../../data/heroes/index.js";
import { ENEMIES } from "../../data/enemies/index.js";
import { createBoard } from "../match3/engine.js";
export function spawnWave(s) {
  s.enemies = s.stage.waves[s.wave].map((spec, i) => {
    const d = { ...ENEMIES[spec.id], ...spec.stats };
    return { ...d, uid: `w${s.wave}-${i}`, hp: d.maxHp, elite: !!spec.elite };
  });
  s.selected = s.enemies[0].uid;
}
export function createBattle(stage) {
  const s = {
    stage,
    wave: 0,
    turn: 0,
    phase: "idle",
    speed: 1,
    paused: false,
    board: createBoard(),
    heroes: stage.team.map((id) => {
      const h = HEROES[id],
        stats = calculateStats(h);
      return { ...h, stats, hp: stats.hp, energy: 0, shield: 0, modifiers: {} };
    }),
    enemies: [],
    selected: null,
    lastEnemyTarget: null,
  };
  spawnWave(s);
  return s;
}
