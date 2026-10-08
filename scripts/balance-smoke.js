import { writeFile } from "node:fs/promises";
import { createBattle } from "../src/core/battle/battleStore.js";
import { createBattleController } from "../src/core/battle/battleController.js";
import { createBoard, validMoves } from "../src/core/match3/engine.js";
import { STAGES } from "../src/data/stages/index.js";
const noop = async () => {};
const vfx = {
  swap: noop,
  clear: noop,
  fall: noop,
  wait: noop,
  death: noop,
  hit: noop,
  attack: noop,
  ultimate: async (_hero, resolve) => {
    const feedback = await resolve();
    await feedback.finished;
  },
  ultimateImpact: async (_events, render) => {
    render();
    return { finished: Promise.resolve() };
  },
};
const view = {
  render() {},
  actor() {},
  board: { render() {} },
  message() {},
  result() {},
  enemies: { spawn() {} },
};
let wins = 0;
const turns = [];
for (let seed = 1; seed <= 100; seed++) {
  let value = seed;
  const rng = () =>
    (value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296;
  const state = createBattle(STAGES["1-1"]);
  state.board = createBoard(rng);
  const controller = createBattleController(state, view, vfx, { rng });
  for (let i = 0; i < 150 && state.phase === "idle"; i++) {
    for (const h of state.heroes)
      if (h.hp > 0 && h.energy >= 100) await controller.useUltimate(h.id);
    if (state.phase !== "idle") break;
    const moves = validMoves(state.board);
    await controller.move(...moves[Math.floor(rng() * moves.length)]);
  }
  if (state.phase === "victory") {
    wins++;
    turns.push(state.turn);
  }
}
const result = {
  runs: 100,
  wins,
  winRate: wins / 100,
  averageWinningTurns: turns.reduce((a, b) => a + b, 0) / turns.length,
  policy:
    "Random valid moves; full-energy ultimates activated immediately. Automated smoke check, not a measured new-player clear rate.",
};
await writeFile(
  "tests/artifacts/balance-smoke.json",
  JSON.stringify(result, null, 2),
);
console.log(result);
