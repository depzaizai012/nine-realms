import { BOARD_CONFIG as C } from "../../data/boardConfig.js";
import { adjacent } from "./boardUtils.js";
export function attachInput(root, { canInput, swap, interact }) {
  let start = null,
    selected = null;
  const clear = () => {
    root
      .querySelectorAll(".picked")
      .forEach((el) => el.classList.remove("picked"));
  };
  root.addEventListener("pointerdown", (e) => {
    interact();
    if (!canInput()) return;
    const cell = e.target.closest("[data-cell]");
    if (!cell) return;
    e.preventDefault();
    start = {
      index: Number(cell.dataset.cell),
      x: e.clientX,
      y: e.clientY,
      pointer: e.pointerId,
    };
    root.setPointerCapture(e.pointerId);
  });
  root.addEventListener("pointerup", (e) => {
    if (!start) return;
    const { index, x, y } = start;
    start = null;
    const dx = e.clientX - x,
      dy = e.clientY - y;
    if (Math.hypot(dx, dy) > 15) {
      const to =
        index +
        (Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? 1
            : -1
          : dy > 0
            ? C.cols
            : -C.cols);
      selected = null;
      clear();
      if (to >= 0 && to < C.rows * C.cols && adjacent(index, to))
        swap(index, to);
      return;
    }
    if (selected !== null && selected !== index && adjacent(selected, index)) {
      const from = selected;
      selected = null;
      clear();
      swap(from, index);
    } else {
      clear();
      selected = index;
      root.children[index].classList.add("picked");
    }
  });
  root.addEventListener("pointercancel", () => {
    start = null;
    selected = null;
    clear();
  });
  root.addEventListener("keydown", (e) => {
    const cell = e.target.closest("[data-cell]");
    if (!cell) return;
    const i = Number(cell.dataset.cell),
      d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -C.cols, ArrowDown: C.cols }[
        e.key
      ];
    if (
      d &&
      canInput() &&
      i + d >= 0 &&
      i + d < C.rows * C.cols &&
      adjacent(i, i + d)
    ) {
      e.preventDefault();
      interact();
      swap(i, i + d);
    }
  });
}
