import { getVfxPreset, getElementColor, readVfxOverrides } from "./autoVfxLibrary.js";
import { createEffekseerBridge } from "./effekseerBridge.js";

/**
 * Visual-only sidecar. No callbacks write HP, Energy, stage turns or damage.
 * An imported .efkefc may use the optional Effekseer runtime; missing runtime
 * gracefully falls back to a built-in CSS burst, never a broken battle.
 */
export function createAutoVfxPlayer(layer, state = {}, { animate } = {}) {
  const active = new Set();
  const overrides = readVfxOverrides();
  let stopped = false, bridge;
  const pointOf = (target) => {
    if (!target) return null;
    if (Number.isFinite(target.x) && Number.isFinite(target.y)) return target;
    if (typeof target.getBoundingClientRect !== "function") return null;
    const p = target.getBoundingClientRect(), bounds = layer.getBoundingClientRect();
    return { x: p.left + p.width / 2 - bounds.left, y: p.top + p.height / 2 - bounds.top };
  };

  async function play(id, target, options = {}) {
    if (stopped || state.disposed || !layer) return false;
    const preset = getVfxPreset(id, overrides);
    if (!preset) return false;
    const point = pointOf(target);
    if (!point) return false;
    const scale = Math.max(0.4, Math.min(3, Number(options.scale) || preset.scale || 1));
    const duration = Math.max(100, Math.min(3000, Number(options.duration) || preset.duration || 400));
    if (preset.sourceType === "effekseer" && preset.url) {
      try {
        bridge ||= createEffekseerBridge(layer, state);
        await bridge.play(preset.url, point, { scale, duration });
        return true;
      } catch (error) {
        // Runtime and effects are optional; keep the browser effect operational.
        if (!stopped) console.warn("[AutoVFX] Effekseer unavailable; CSS fallback:", error);
      }
    }
    if (stopped || state.disposed) return false;
    const effect = document.createElement("i");
    const shape = preset.shape || "impact";
    effect.className = `auto-vfx auto-vfx--${shape}`;
    effect.setAttribute("aria-hidden", "true");
    effect.style.left = `${point.x}px`;
    effect.style.top = `${point.y}px`;
    effect.style.setProperty("--vfx-color", getElementColor(options.element));
    effect.style.setProperty("--vfx-scale", String(scale));
    layer.append(effect);
    active.add(effect);
    const frames = shape === "slash" ? [
      { opacity: 0, transform: `translate(-50%,-50%) rotate(-50deg) scale(${scale * 0.3})` },
      { opacity: 1, offset: 0.35, transform: `translate(-50%,-50%) rotate(-20deg) scale(${scale})` },
      { opacity: 0, transform: `translate(-50%,-50%) rotate(15deg) scale(${scale * 1.35})` },
    ] : [
      { opacity: 0, transform: `translate(-50%,-50%) scale(${scale * 0.25})` },
      { opacity: 0.92, offset: 0.35, transform: `translate(-50%,-50%) scale(${scale})` },
      { opacity: 0, transform: `translate(-50%,-50%) scale(${scale * 1.35})` },
    ];
    try {
      if (animate) await animate(effect, frames, duration);
      else {
        const animation = effect.animate(frames, { duration, fill: "none", easing: "ease-out" });
        active.add(animation);
        animation.playbackRate = Number(options.speed) === 2 ? 2 : 1;
        try { await animation.finished; } finally { active.delete(animation); }
      }
    } catch (error) {
      if (error?.name !== "AbortError" && !stopped) console.warn("[AutoVFX]", error);
    } finally {
      active.delete(effect);
      effect.remove();
    }
    return true;
  }

  function dispose() {
    stopped = true;
    for (const node of active) {
      if (typeof node.cancel === "function") node.cancel();
      else node.remove();
    }
    active.clear();
    bridge?.dispose();
    bridge = null;
  }

  return { play, dispose };
}
