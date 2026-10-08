import { BOARD_CONFIG as C } from "../../data/boardConfig.js";
export const adjacent = (a, b) =>
  Math.abs((a % C.cols) - (b % C.cols)) +
    Math.abs(Math.floor(a / C.cols) - Math.floor(b / C.cols)) ===
  1;
export const neighbors = (i) =>
  [i - 1, i + 1, i - C.cols, i + C.cols].filter(
    (j) => j >= 0 && j < C.rows * C.cols && adjacent(i, j),
  );
export function swapped(board, a, b) {
  const next = board.map((g) => ({ ...g }));
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
