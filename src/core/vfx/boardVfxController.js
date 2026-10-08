import { BOARD_CONFIG as C } from "../../data/boardConfig.js";
import { VFX_CONFIG as T } from "./vfxConfig.js";
import { COLORS } from "../../data/elements/index.js";

export function lineCells(index, type) {
  const row = Math.floor(index / C.cols),
    col = index % C.cols;
  return type === "LINE_HORIZONTAL"
    ? Array.from({ length: C.cols }, (_, c) => row * C.cols + c)
    : Array.from({ length: C.rows }, (_, r) => r * C.cols + col);
}
export function createBoardVfx(ctx) {
  const {
    root,
    state,
    boardView,
    animate,
    wait,
    center,
    effect,
    particles,
    hitStop,
    shake,
  } = ctx;
  const layer = root.querySelector(".board-vfx-layer");
  const spawn = (cls, p, color) => effect(cls, p.x, p.y, color, layer);
  const position = (el) => center(el, layer);
  async function explode(index, handled, pending) {
    if (handled.has(index)) return;
    handled.add(index);
    const cell = boardView.cells[index],
      color = COLORS[state.board[index].element];
    await Promise.all([
      animate(
        cell,
        [
          { filter: "brightness(1)", transform: "scale(1)", opacity: 1 },
          {
            filter: "brightness(1.65)",
            transform: "scale(1.1)",
            opacity: 1,
            offset: 0.3,
          },
          { filter: "brightness(1)", transform: "scale(.2)", opacity: 0 },
        ],
        T.clear,
      ),
      particles(cell, color, false, {
        layer,
        duration: T.clear,
        count: 5,
        spread: 17,
      }),
    ]);
    if (!pending.has(index)) cell.style.visibility = "hidden";
  }
  async function line(activation, step, handled, pending) {
    const indices = lineCells(activation.index, activation.type),
      horizontal = activation.type === "LINE_HORIZONTAL";
    const first = boardView.cells[indices[0]].getBoundingClientRect(),
      last = boardView.cells[indices.at(-1)].getBoundingClientRect();
    const origin = layer.getBoundingClientRect(),
      color = COLORS[state.board[activation.index].element],
      p = position(boardView.cells[activation.index]);
    const beam = spawn(
      `beam ${horizontal ? "horizontal" : "vertical"}`,
      {
        x: horizontal ? first.left - origin.left : p.x,
        y: horizontal ? p.y : first.top - origin.top,
      },
      color,
    );
    if (horizontal) {
      beam.style.width = `${last.right - first.left}px`;
      beam.style.height = "4px";
      beam.style.transform = "translateY(-50%)";
    } else {
      beam.style.height = `${last.bottom - first.top}px`;
      beam.style.width = "4px";
      beam.style.transform = "translateX(-50%)";
    }
    beam.dataset.cells = indices.join(",");
    await Promise.all([
      animate(
        beam,
        [
          {
            opacity: 1,
            clipPath: horizontal ? "inset(0 100% 0 0)" : "inset(0 0 100% 0)",
          },
          { opacity: 1, clipPath: "inset(0 0 0 0)", offset: 0.85 },
          { opacity: 0, clipPath: "inset(0 0 0 0)" },
        ],
        T.lineSweep,
      ),
      ...indices
        .filter((i) => step.clear.includes(i))
        .map((index, i) =>
          (async () => {
            await wait(i * T.lineCellStagger);
            await explode(index, handled, pending);
          })(),
        ),
    ]);
    beam.remove();
  }
  async function special(activation, step, handled, pending) {
    const cell = boardView.cells[activation.index],
      p = position(cell),
      type = activation.type,
      color = COLORS[activation.element] || "#e5b8ff";
    pending.delete(activation.index);
    cell.style.visibility = "";
    await animate(
      cell,
      [
        { filter: "brightness(1)", transform: "scale(1)" },
        { filter: "brightness(2)", transform: "scale(1.14)", offset: 0.65 },
        { filter: "brightness(1)", transform: "scale(1)" },
      ],
      type.startsWith("LINE") ? T.lineCharge : T.clear,
    );
    if (type.startsWith("LINE")) await line(activation, step, handled, pending);
    else if (type === "BOMB") {
      const ring = spawn("explosion", p, "#ffd37c");
      await hitStop(T.bombStop);
      await Promise.all([
        shake(),
        animate(
          ring,
          [
            { opacity: 1, transform: "translate(-50%,-50%) scale(.1)" },
            { opacity: 0, transform: "translate(-50%,-50%) scale(2)" },
          ],
          T.bomb,
        ),
      ]);
      ring.remove();
    } else {
      const rays = step.clear
        .filter(
          (i) =>
            i === activation.index ||
            activation.element === "ALL" ||
            state.board[i].element === activation.element,
        )
        .map((i) => {
          const q = position(boardView.cells[i]),
            ray = spawn("prism-ray", p, "#eed6ff");
          ray.style.width = `${Math.hypot(q.x - p.x, q.y - p.y)}px`;
          ray.style.transform = `rotate(${Math.atan2(q.y - p.y, q.x - p.x)}rad)`;
          return ray;
        });
      await animate(
        cell,
        [
          { filter: "hue-rotate(0deg) brightness(2)" },
          { filter: "hue-rotate(360deg) brightness(3)" },
        ],
        T.prism,
      );
      rays.forEach((el) => el.remove());
    }
    if (handled.has(activation.index)) cell.style.visibility = "hidden";
  }
  async function clear(step) {
    const handled = new Set(),
      pending = new Set(step.activations.map((a) => a.index));
    for (const activation of step.activations)
      await special(activation, step, handled, pending);
    await Promise.all(
      step.clear.map((index) => explode(index, handled, pending)),
    );
  }
  async function fall(before, after = state.board) {
    if (!before) return;
    const previous = new Map(before.map((g, i) => [g.id, i]));
    const height = boardView.cells[0].getBoundingClientRect().height;
    await Promise.all(
      after.map((g, i) => {
        const old = previous.get(g.id);
        if (old === i) return Promise.resolve();
        const distance =
          old === undefined
            ? -height * 2
            : (Math.floor(old / C.cols) - Math.floor(i / C.cols)) * height;
        return animate(
          boardView.cells[i],
          [
            { transform: `translateY(${distance}px)` },
            { transform: "translateY(0)" },
          ],
          T.fall,
        );
      }),
    );
  }
  return { clear, fall };
}
