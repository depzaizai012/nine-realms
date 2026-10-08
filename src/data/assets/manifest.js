import { STAGES } from "../stages/index.js";
import { ELEMENTS } from "../elements/index.js";
import { ASSET_CATALOG } from "./catalog.js";
import { REALMS } from "../realms/index.js";
export const MANIFEST = Object.fromEntries(
  Object.entries(ASSET_CATALOG).map(([key, value]) => [key, value.url]),
);
const fallback =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect x="16" y="16" width="96" height="96" rx="28" fill="#45685b"/><path d="M64 30L90 64 64 98 38 64Z" fill="#b9d6ae"/></svg>',
  );
export function installAssetFallbacks(root) {
  root.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (img instanceof HTMLImageElement && img.src !== fallback) {
        if (import.meta.env.DEV) console.warn(`Failed asset: ${img.src}`);
        img.src = fallback;
      }
    },
    true,
  );
}
function asset(key) {
  if (MANIFEST[key]) return MANIFEST[key];
  if (import.meta.env?.DEV) console.warn(`Missing asset: ${key}.png`);
  return fallback;
}
export const getHeroAsset = (id, type) => asset(`${id}_${type.toUpperCase()}`);
// The supplied LINE_H art is vertical and LINE_V art is horizontal.
// Keep canonical IDs/filenames and orient each overlay to its logical direction.
export const getGemSpecialRotation = (type) =>
  ["LINE_HORIZONTAL", "LINE_VERTICAL"].includes(type) ? 90 : 0;
const ULTIMATE_ASSET_ORDER = [
  "full_body",
  "ultimate_cutin",
  "battle_cutin",
  "avatar",
];
const warnedUltimateAssets = new Set();
export function getHeroUltimateAssets(id, { warn = true } = {}) {
  const candidates = [];
  for (const type of ULTIMATE_ASSET_ORDER) {
    const key = `${id}_${type.toUpperCase()}`;
    if (MANIFEST[key]) candidates.push({ url: MANIFEST[key], type, key });
    else if (warn && import.meta.env?.DEV && !warnedUltimateAssets.has(key)) {
      console.warn(
        `Missing ultimate asset: ${key}.png; trying the next production asset.`,
      );
      warnedUltimateAssets.add(key);
    }
    // Only warn for the missing assets above the first available choice.
    if (candidates.length) warn = false;
  }
  return candidates.length
    ? candidates
    : [
        {
          url: getHeroAsset(id, "avatar"),
          type: "avatar",
          key: `${id}_AVATAR`,
        },
      ];
}
export const getHeroUltimateAsset = (id, options) =>
  getHeroUltimateAssets(id, options)[0];
export async function loadHeroUltimateAsset(id) {
  for (const candidate of getHeroUltimateAssets(id)) {
    const loaded = await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = candidate.url;
    });
    if (loaded) return candidate;
    if (import.meta.env.DEV)
      console.warn(
        `Failed ultimate asset: ${candidate.url}; trying the next production asset.`,
      );
  }
  return { url: fallback, type: "avatar", key: `${id}_AVATAR` };
}
export const getEnemyAsset = (id, state = "idle") =>
  asset(`${id}_${state.toUpperCase()}`);
export const getBossAsset = (id, phase) =>
  asset(`${id}_PHASE_${String(phase).padStart(2, "0")}`);
export const getGemBaseAsset = (element) => asset(`GEM_${element}`);
export const getGemSpecialAsset = (type) =>
  asset(
    `GEM_SPECIAL_${{ LINE_HORIZONTAL: "LINE_H", LINE_VERTICAL: "LINE_V" }[type] || type}`,
  );
export const getGemHazardAsset = (type) => asset(`GEM_HAZARD_${type}`);
export const getBattleBackground = (id) =>
  asset(
    {
      VERDANT_VILLAGE: "BG_W01_VILLAGE",
      VERDANT_WHISPERING_FOREST: "BG_W01_WHISPERING_FOREST",
      VERDANT_WOOD_TEMPLE: "BG_W01_WOOD_TEMPLE",
    }[id] || id,
  );
export const getRealmBoardFrame = (realm) =>
  asset({ VERDANT_REALM: "FRAME_W01_BOARD" }[realm] || `FRAME_${realm}_BOARD`);
export const getRealmIcon = (realm) =>
  asset(REALMS.find((r) => r.id === realm)?.iconAsset || `ICON_${realm}`);
export function stageAssets(id = "1-1") {
  const s = STAGES[id];
  return [
    ...new Set([
      ...s.team.map((h) => getHeroAsset(h, "avatar")),
      ...s.team.map((h) => getHeroUltimateAsset(h, { warn: false }).url),
      ...s.waves
        .flat()
        .flatMap((e) => ["idle", "attack"].map((t) => getEnemyAsset(e.id, t))),
      ...ELEMENTS.map(getGemBaseAsset),
      ...["LINE_HORIZONTAL", "LINE_VERTICAL", "BOMB", "PRISM"].map(
        getGemSpecialAsset,
      ),
      ...s.hazards.map(getGemHazardAsset),
      getBattleBackground(s.background),
      getRealmBoardFrame(s.realm),
    ]),
  ];
}
