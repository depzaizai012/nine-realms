import { getHudAsset, getStatusIconAsset } from "../../data/assets/manifest.js";
import { getHeroStatuses, getStatusSlots } from "./heroHudState.js";
export function hudImage(card, key, className) {
  const image = document.createElement("img");
  image.className = className;
  image.alt = "";
  image.draggable = false;
  image.dataset.hudAsset = key;
  const url = getHudAsset(key);
  if (url) image.src = url;
  else {
    image.hidden = true;
    card.classList.add(`missing-${key.toLowerCase()}`);
  }
  return image;
}
export function createStatusView(card, container) {
  container.append(hudImage(card, "HUD_STATUS_BAR_BG", "status-bar-bg"));
  const icons = document.createElement("div");
  icons.className = "status-icons";
  container.append(icons);
  let previous = "";
  function slot() {
    const node = document.createElement("span");
    node.className = "status-slot";
    node.append(hudImage(card, "HUD_STATUS_ICON_SLOT", "status-slot-bg"));
    icons.append(node);
    return node;
  }
  return {
    render(hero) {
      const { visible, overflowCount, totalCount } = getStatusSlots(
        getHeroStatuses(hero),
      );
      container.hidden = totalCount === 0;
      container.dataset.overflowCount = overflowCount;
      // Cache only visible fields, not live combat references or shield amounts.
      const signature = JSON.stringify([
        visible.map((s) => [
          s.id,
          s.type,
          s.name,
          s.iconAssetId,
          s.iconKey,
          s.assetId,
          s.stacks,
          s.durationTurns,
        ]),
        overflowCount,
      ]);
      if (signature === previous) return;
      previous = signature;
      icons.replaceChildren();
      for (const status of visible) {
        const node = slot();
        node.dataset.statusId = status.id;
        node.dataset.type = status.type;
        node.classList.add(`status-${status.tone}`);
        node.title =
          status.name +
          (status.stacks > 1 ? ` ×${status.stacks}` : "") +
          (status.durationTurns ? ` · ${status.durationTurns} turns` : "");
        node.setAttribute("aria-label", node.title);
        const url = getStatusIconAsset(status);
        if (url) {
          const icon = document.createElement("img");
          icon.className = "actual-status-icon";
          icon.src = url;
          icon.alt = status.name;
          node.append(icon);
        } else {
          const icon = document.createElement("span");
          icon.className = "actual-status-icon status-symbol";
          icon.innerHTML = status.iconSvg;
          node.append(icon);
        }
        if (status.stacks > 1 || status.durationTurns > 0) {
          const counter = document.createElement("small");
          counter.className = "status-counter";
          counter.textContent =
            status.stacks > 1 ? `×${status.stacks}` : status.durationTurns;
          node.append(counter);
        }
      }
      if (overflowCount) {
        const node = slot();
        node.classList.add("status-overflow");
        const text = document.createElement("b");
        text.textContent = `+${overflowCount}`;
        node.append(text);
        node.setAttribute("aria-label", `${overflowCount} more effects`);
      }
    },
  };
}
