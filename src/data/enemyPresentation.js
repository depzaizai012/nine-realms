import { getAssetMetadata } from "./assets/manifest.js";
export const ENEMY_PRESENTATION = {
  NORMAL: { scale: 1, ring: "#dfcf77", glow: "#bde68a" },
  ELITE: { scale: 1.17, ring: "#c692f2", glow: "#eea0dc" },
  BOSS: { scale: 1.45, ring: "#e67c59", glow: "#e9ba61" },
};
export function getSpritePlacement(key, fallback = {}) {
  const meta = getAssetMetadata(key);
  if (!meta?.bounds)
    return {
      scale: fallback.scale ?? 1,
      x: fallback.x ?? 0,
      y: fallback.y ?? 0,
    };
  const { bounds: b, width: w, height: h } = meta,
    aspect = w / h,
    cw = Math.min(1, aspect),
    ch = Math.min(1, 1 / aspect),
    bw = ((b.right - b.left + 1) / w) * cw,
    bh = ((b.bottom - b.top + 1) / h) * ch;
  const scale = Math.min(0.88 / bw, 0.92 / bh),
    center = (1 - cw) / 2 + ((b.left + b.right + 1) / (2 * w)) * cw,
    bottom = (1 - ch) / 2 + ((b.bottom + 1) / h) * ch;
  return {
    scale,
    x: (0.5 - center) * scale * 100,
    y: (1 - bottom) * scale * 100,
  };
}
