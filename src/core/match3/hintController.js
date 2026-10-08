import { validMoves } from "./engine.js";
import { VFX_CONFIG as T } from "../vfx/vfxConfig.js";
import { BOARD_CONFIG as C } from "../../data/boardConfig.js";
export function createHints(state, view) {
  let last = Date.now();
  const reset = () => {
    last = Date.now();
    view.cells.forEach((el) => el.classList.remove("hint", "directional"));
  };
  const timer = setInterval(() => {
    if (state.phase !== "idle" || state.paused) {
      reset();
      return;
    }
    const elapsed = Date.now() - last;
    if (elapsed < T.hint) return;
    const move = validMoves(state.board)[0];
    if (!move) return;
    for (const i of move) view.cells[i].classList.add("hint");
    if (elapsed > T.directionalHint) {
      const [a, b] = move;
      view.cells[a].style.setProperty(
        "--hint-x",
        `${Math.sign((b % C.cols) - (a % C.cols)) * 4}px`,
      );
      view.cells[a].style.setProperty(
        "--hint-y",
        `${Math.sign(Math.floor(b / C.cols) - Math.floor(a / C.cols)) * 4}px`,
      );
      view.cells[a].classList.add("directional");
    }
  }, 500);
  return { reset, destroy: () => clearInterval(timer) };
}
