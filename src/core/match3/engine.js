import { BOARD_CONFIG as C } from "../../data/boardConfig.js";
import { ELEMENTS } from "../../data/elements/index.js";
import { adjacent, neighbors, swapped } from "./boardUtils.js";
let serial = 0;
export const gem = (rng = Math.random) => ({
  id: ++serial,
  element: ELEMENTS[Math.floor(rng() * ELEMENTS.length)],
  specialType: null,
  hazardType: null,
});
const matchable = (g) => g && !["BOMB", "PRISM"].includes(g.specialType);
export function findMatches(board) {
  const groups = [];
  for (const horizontal of [true, false]) {
    const lines = horizontal ? C.rows : C.cols,
      length = horizontal ? C.cols : C.rows;
    for (let l = 0; l < lines; l++) {
      let run = [];
      const flush = () => {
        if (run.length >= 3)
          groups.push({
            cells: [...run],
            element: board[run[0]].element,
            horizontal,
          });
        run = [];
      };
      for (let p = 0; p < length; p++) {
        const i = horizontal ? l * C.cols + p : p * C.cols + l;
        if (
          !matchable(board[i]) ||
          (run.length && board[i].element !== board[run[0]].element)
        )
          flush();
        if (matchable(board[i])) run.push(i);
      }
      flush();
    }
  }
  return groups;
}
export function isValidSwap(board, a, b) {
  if (
    !adjacent(a, b) ||
    board[a].hazardType === "LOCKED" ||
    board[b].hazardType === "LOCKED"
  )
    return false;
  if (
    [board[a], board[b]].some((g) => ["BOMB", "PRISM"].includes(g.specialType))
  )
    return true;
  return findMatches(swapped(board, a, b)).some(
    (g) => g.cells.includes(a) || g.cells.includes(b),
  );
}
export function validMoves(board) {
  const result = [];
  for (let a = 0; a < board.length; a++)
    for (const b of neighbors(a))
      if (b > a && isValidSwap(board, a, b)) result.push([a, b]);
  return result;
}
export function createBoard(rng = Math.random) {
  for (let tries = 0; tries < 1000; tries++) {
    const board = Array.from({ length: C.cols * C.rows }, () => gem(rng));
    for (let i = 0; i < board.length; i++) {
      let n = 0;
      while (
        n++ < 30 &&
        ((i % C.cols >= 2 &&
          board[i].element === board[i - 1].element &&
          board[i].element === board[i - 2].element) ||
          (i >= 2 * C.cols &&
            board[i].element === board[i - C.cols].element &&
            board[i].element === board[i - 2 * C.cols].element))
      )
        board[i] = gem(rng);
    }
    if (!findMatches(board).length && validMoves(board).length) return board;
  }
  throw Error("Unable to generate playable board");
}
export function shuffle(board, rng = Math.random) {
  for (let t = 0; t < 500; t++) {
    const next = board.map((g) => ({ ...g }));
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    if (!findMatches(next).length && validMoves(next).length) return next;
  }
  return createBoard(rng);
}
export function resolveStep(board, { swap = null } = {}) {
  const groups = findMatches(board),
    clear = new Set(),
    creations = new Map(),
    activations = [];
  for (const group of groups) group.cells.forEach((i) => clear.add(i));
  const used = new Set();
  for (const group of groups) {
    if (used.has(group)) continue;
    const connected = [group];
    let changed = true;
    while (changed) {
      changed = false;
      for (const other of groups)
        if (
          !connected.includes(other) &&
          connected.some((g) => g.cells.some((i) => other.cells.includes(i)))
        ) {
          connected.push(other);
          changed = true;
        }
    }
    connected.forEach((g) => used.add(g));
    const cells = [...new Set(connected.flatMap((g) => g.cells))];
    let type = null;
    if (connected.some((g) => g.cells.length >= 5)) type = "PRISM";
    else if (
      connected.some((g) => g.horizontal) &&
      connected.some((g) => !g.horizontal)
    ) {
      const isL = connected.some(
        (h) =>
          h.horizontal &&
          connected.some(
            (v) =>
              !v.horizontal &&
              h.cells.some(
                (i) =>
                  (i === h.cells[0] || i === h.cells.at(-1)) &&
                  (i === v.cells[0] || i === v.cells.at(-1)),
              ),
          ),
      );
      type = isL ? "PRISM" : "BOMB";
    } else if (group.cells.length === 4)
      type = group.horizontal ? "LINE_HORIZONTAL" : "LINE_VERTICAL";
    if (type) {
      const at =
        swap?.find((i) => cells.includes(i)) ??
        cells[Math.floor(cells.length / 2)];
      if (!board[at].specialType)
        creations.set(at, { ...board[at], specialType: type });
    }
  }
  const targets = new Map();
  if (swap)
    for (const i of swap) {
      const g = board[i];
      if (g.specialType === "BOMB") clear.add(i);
      if (g.specialType === "PRISM") {
        clear.add(i);
        const partner = board[swap.find((j) => j !== i)];
        targets.set(
          i,
          partner.specialType === "PRISM" ? "ALL" : partner.element,
        );
      }
    }
  const triggered = new Set();
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const i of [...clear]) {
      const g = board[i];
      if (!g.specialType || triggered.has(g.id)) continue;
      triggered.add(g.id);
      activations.push({
        index: i,
        type: g.specialType,
        element: targets.get(i) || g.element,
      });
      const add = (j) => {
        if (j >= 0 && j < board.length) {
          creations.delete(j);
          if (!clear.has(j)) {
            clear.add(j);
            expanded = true;
          }
        }
      };
      const row = Math.floor(i / C.cols),
        col = i % C.cols;
      if (g.specialType === "LINE_HORIZONTAL")
        for (let c = 0; c < C.cols; c++) add(row * C.cols + c);
      if (g.specialType === "LINE_VERTICAL")
        for (let r = 0; r < C.rows; r++) add(r * C.cols + col);
      if (g.specialType === "BOMB")
        for (
          let r = Math.max(0, row - 1);
          r <= Math.min(C.rows - 1, row + 1);
          r++
        )
          for (
            let c = Math.max(0, col - 1);
            c <= Math.min(C.cols - 1, col + 1);
            c++
          )
            add(r * C.cols + c);
      if (g.specialType === "PRISM")
        board.forEach((cell, j) => {
          if (
            targets.get(i) === "ALL" ||
            cell.element === (targets.get(i) || g.element)
          )
            add(j);
        });
    }
  }
  for (const a of activations) creations.delete(a.index);
  for (const i of creations.keys()) clear.delete(i);
  const attacks = groups.map((g) => ({
    element: g.element,
    count: g.cells.length,
  }));
  const grouped = new Set(groups.flatMap((g) => g.cells));
  for (const element of ELEMENTS) {
    const count = [...clear].filter(
      (i) => !grouped.has(i) && board[i].element === element,
    ).length;
    if (count) attacks.push({ element, count: Math.max(3, count) });
  }
  return {
    clear: [...clear],
    creations: [...creations],
    activations,
    attacks,
    groups,
  };
}
export function fallAndRefill(board, step, rng = Math.random) {
  const next = board.map((g) => ({ ...g }));
  for (const i of step.clear) next[i] = null;
  for (const [i, g] of step.creations) next[i] = g;
  for (let c = 0; c < C.cols; c++) {
    const survivors = [];
    for (let r = C.rows - 1; r >= 0; r--)
      if (next[r * C.cols + c]) survivors.push(next[r * C.cols + c]);
    for (let r = C.rows - 1; r >= 0; r--)
      next[r * C.cols + c] = survivors[C.rows - 1 - r] || gem(rng);
  }
  return next;
}
