import { getHudAsset } from "../../data/assets/manifest.js";
export function createBattleControls(root, state, clock, actions) {
  const help = root.querySelector(".help"),
    speed = root.querySelector(".speed"),
    pause = root.querySelector(".pause");
  function img(key, cls) {
    const url = getHudAsset(key);
    return url
      ? `<img class="control-art ${cls}" data-hud-asset="${key}" src="${url}" alt="">`
      : "";
  }
  help.innerHTML =
    img("BTN_BATTLE_HELP", "") + '<span class="control-fallback">!</span>';
  speed.innerHTML =
    img("BTN_BATTLE_SPEED_X2", "speed-normal") +
    img("BTN_BATTLE_SPEED_X2_ACTIVE", "speed-active") +
    '<span class="control-fallback">×2</span>';
  pause.innerHTML =
    img("BTN_BATTLE_PAUSE", "") + '<span class="control-fallback">Ⅱ</span>';
  help.onclick = actions.openElementHelp;
  pause.onclick = actions.openPauseMenu;
  const render = () => {
    speed.classList.toggle("active", state.battleSpeedMultiplier === 2);
    speed.setAttribute(
      "aria-pressed",
      String(state.battleSpeedMultiplier === 2),
    );
    speed.disabled = !!state.activeBattleOverlay || state.paused;
  };
  const toggleBattleSpeed = () => {
    if (clock.setSpeed(state.battleSpeedMultiplier === 1 ? 2 : 1)) render();
    return state.battleSpeedMultiplier;
  };
  speed.onclick = toggleBattleSpeed;
  render();
  return { render, toggleBattleSpeed };
}
