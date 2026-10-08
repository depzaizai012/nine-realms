import { getEnemyAsset } from "../../data/assets/manifest.js";
export function createEnemyView(root, onSelect) {
  return {
    spawn(enemies) {
      root.replaceChildren();
      for (const e of enemies) {
        const el = document.createElement("button");
        el.className = "enemy" + (e.elite ? " elite" : "");
        el.dataset.actor = e.uid;
        el.setAttribute(
          "aria-label",
          `Target ${e.elite ? "Elite " : ""}${e.name}`,
        );
        el.innerHTML = `<span class="target-ring"></span><img src="${getEnemyAsset(e.assetId, "idle")}" alt="${e.name}" draggable="false">`;
        el.onclick = () => onSelect(e.uid);
        root.append(el);
      }
    },
    render(state) {
      for (const el of root.children)
        el.classList.toggle("selected", el.dataset.actor === state.selected);
    },
  };
}
