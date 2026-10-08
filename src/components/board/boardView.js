import { BOARD_CONFIG as C } from "../../data/boardConfig.js";
import {
  getGemBaseAsset,
  getGemSpecialAsset,
  getGemHazardAsset,
} from "../../data/assets/manifest.js";
export function createBoardView(root) {
  root.style.setProperty("--cols", C.cols);
  root.style.setProperty("--rows", C.rows);
  const cells = Array.from({ length: C.rows * C.cols }, (_, i) => {
    const el = document.createElement("button");
    el.className = "gem";
    el.dataset.cell = i;
    el.setAttribute("role", "gridcell");
    el.innerHTML =
      '<img class="base" draggable="false" alt=""><img class="special" draggable="false" alt=""><img class="hazard" draggable="false" alt="">';
    root.append(el);
    return el;
  });
  return {
    cells,
    render(board) {
      board.forEach((g, i) => {
        const el = cells[i];
        el.dataset.gem = g.id;
        el.setAttribute(
          "aria-label",
          `${g.element}${g.specialType ? " " + g.specialType : ""}, row ${Math.floor(i / C.cols) + 1}, column ${(i % C.cols) + 1}`,
        );
        const independent = ["BOMB", "PRISM"].includes(g.specialType);
        el.children[0].src = independent
          ? getGemSpecialAsset(g.specialType)
          : getGemBaseAsset(g.element);
        el.children[1].hidden = !g.specialType || independent;
        if (g.specialType && !independent)
          el.children[1].src = getGemSpecialAsset(g.specialType);
        el.children[2].hidden = !g.hazardType;
        if (g.hazardType) el.children[2].src = getGemHazardAsset(g.hazardType);
      });
    },
  };
}
