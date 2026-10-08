import { VFX_CONFIG as T } from "../vfx/vfxConfig.js";
export function installBattleSpeed(state) {
  state.battleSpeedMultiplier = state.speed ?? 1;
  delete state.speed;
  Object.defineProperty(state, "speed", {
    enumerable: false,
    get: () => state.battleSpeedMultiplier,
    set: (value) => {
      state.battleSpeedMultiplier =
        Number.isFinite(value) && value > 0 ? value : 1;
    },
  });
  return state;
}
export function createBattleClock(state, root) {
  const abort = new AbortController(),
    animations = new Set(),
    timers = new Set();
  const stopped = () => abort.signal.aborted,
    abortError = () => new DOMException("Battle disposed", "AbortError"),
    speed = () => state.battleSpeedMultiplier ?? state.speed ?? 1;
  function delay(ms) {
    return new Promise((resolve, reject) => {
      if (stopped()) return reject(abortError());
      const cancel = () => {
        clearTimeout(timer);
        timers.delete(timer);
        reject(abortError());
      };
      const timer = setTimeout(() => {
        timers.delete(timer);
        abort.signal.removeEventListener("abort", cancel);
        resolve();
      }, ms);
      timers.add(timer);
      abort.signal.addEventListener("abort", cancel, { once: true });
    });
  }
  async function wait(ms) {
    let remaining = ms;
    while (state.paused || remaining > 0) {
      if (stopped()) throw abortError();
      const start = performance.now();
      await delay(
        state.paused ? T.tick : Math.min(remaining / speed(), T.tick),
      );
      if (!state.paused) remaining -= (performance.now() - start) * speed();
    }
    if (stopped()) throw abortError();
  }
  async function animate(el, frames, ms) {
    if (!el || stopped()) return;
    const a = el.animate(frames, {
      duration: ms,
      easing: "ease-in-out",
      fill: "none",
    });
    animations.add(a);
    const update = () => {
      a.playbackRate = speed();
      if (state.paused || root.classList.contains("hit-stop")) {
        if (a.playState === "running") a.pause();
      } else if (a.playState === "paused") a.play();
    };
    update();
    const timer = setInterval(update, T.tick);
    timers.add(timer);
    try {
      await a.finished;
    } catch {
    } finally {
      clearInterval(timer);
      timers.delete(timer);
      animations.delete(a);
    }
  }
  const cssTimed = (a) =>
    a instanceof CSSTransition ||
    (a instanceof CSSAnimation &&
      ["hero-ready-arrival", "mana-ready-arrival"].includes(a.animationName));
  function updateCss(target = root) {
    for (const a of target.getAnimations({ subtree: true }))
      if (cssTimed(a)) a.playbackRate = speed();
  }
  const onCssStart = (e) => updateCss(e.target);
  root.addEventListener("animationstart", onCssStart, { signal: abort.signal });
  root.addEventListener("transitionrun", onCssStart, { signal: abort.signal });
  let pausedCss = [];
  function pause(value) {
    if (state.paused === value) return;
    state.paused = value;
    if (value) {
      pausedCss = root
        .querySelector(".visual-root")
        .getAnimations({ subtree: true })
        .filter((a) => a.playState === "running");
      pausedCss.forEach((a) => a.pause());
    } else {
      pausedCss.forEach((a) => {
        if (a.playState === "paused") a.play();
      });
      pausedCss = [];
    }
  }
  function setSpeed(value) {
    if (state.activeBattleOverlay || state.paused || stopped()) return false;
    state.battleSpeedMultiplier = value === 2 ? 2 : 1;
    for (const a of animations) a.playbackRate = speed();
    updateCss();
    return true;
  }
  function dispose() {
    state.disposed = true;
    abort.abort();
    for (const timer of timers) {
      clearTimeout(timer);
      clearInterval(timer);
    }
    timers.clear();
    root.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    animations.clear();
    pausedCss = [];
  }
  return {
    wait,
    animate,
    pause,
    setSpeed,
    dispose,
    get pendingTimers() {
      return timers.size;
    },
  };
}
