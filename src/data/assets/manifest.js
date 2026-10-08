import { STAGES } from "../stages/index.js";
import { ELEMENTS } from "../elements/index.js";
import { ASSET_CATALOG } from "./catalog.js";
import { REALMS } from "../realms/index.js";
import { ASSET_ALIASES } from "./battleAssetBindings.js";
import { resolveBattleBackground } from "../battleBackgroundRules.js";
export const MANIFEST = Object.fromEntries(
  Object.entries(ASSET_CATALOG).map(([key, value]) => [key, value.url]),
);
for (const [key, target] of Object.entries(ASSET_ALIASES))
  if (ASSET_CATALOG[target]) MANIFEST[key] = ASSET_CATALOG[target].url;
export const getAssetMetadata = (key) =>
  ASSET_CATALOG[ASSET_ALIASES[key] || key];
export const COMMON_HUD_ASSETS = Object.freeze([
  "HUD_HERO_FRAME_NORMAL",
  "HUD_HERO_FRAME_ULT_READY",
  "HUD_HERO_ULT_GLOW_OVERLAY",
  "HUD_HERO_BAR_BG",
  "HUD_STATUS_ICON_SLOT",
  "HUD_STATUS_BAR_BG",
]);
// Paths verified against the actual supplied files; preserve names and originals.
for (const key of COMMON_HUD_ASSETS) MANIFEST[key] = `/assets/ui/${key}.png`;
const failedHudAssets = new Set(),
  warnedHudAssets = new Set();
export const BATTLE_CONTROL_ASSETS = Object.freeze([
  "BTN_BATTLE_HELP",
  "BTN_BATTLE_SPEED_X2",
  "BTN_BATTLE_SPEED_X2_ACTIVE",
  "BTN_BATTLE_PAUSE",
  "BTN_BATTLE_PAUSE_MENU_BG",
  "PANEL_ELEMENTAL_ADVANTAGE_BG",
]);
for (const key of BATTLE_CONTROL_ASSETS)
  MANIFEST[key] = `/assets/ui/${key}.png`;
export function markHudAssetFailed(key) {
  failedHudAssets.add(key);
  if (import.meta.env?.DEV && !warnedHudAssets.has(key)) {
    console.warn(`HUD asset unavailable: ${key}.png; using CSS fallback.`);
    warnedHudAssets.add(key);
  }
}
export function getHudAsset(key) {
  if (!MANIFEST[key] || failedHudAssets.has(key)) {
    markHudAssetFailed(key);
    return null;
  }
  return MANIFEST[key];
}
export function getStatusIconAsset(status) {
  const key = status.iconAssetId ?? status.iconKey ?? status.assetId;
  if (!key) return null;
  return MANIFEST[key] || null;
}
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
      if (img instanceof HTMLImageElement && img.dataset.hudAsset) {
        const key = img.dataset.hudAsset;
        markHudAssetFailed(key);
        root
          .querySelectorAll(`img[data-hud-asset="${key}"]`)
          .forEach((node) => {
            node.hidden = true;
            node.closest(".overlay-panel")?.classList.add("ui-panel-fallback");
            node
              .closest(".hero-card")
              ?.classList.add(`missing-${key.toLowerCase()}`);
          });
        return;
      }
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
// Elemental line artwork already has its canonical H/V orientation.
export const getGemSpecialRotation = () => 0;
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
export const getBattlerAssetKey = (enemy, mode = "idle") =>
  enemy.assetId?.startsWith("BOSS_")
    ? `${enemy.assetId}_PHASE_${String(enemy.phase ?? 1).padStart(2, "0")}`
    : `${enemy.assetId}_${mode.toUpperCase()}`;
export const getBattlerAsset = (enemy, mode) =>
  asset(getBattlerAssetKey(enemy, mode));
export const getBossAsset = (id, phase) =>
  asset(`${id}_PHASE_${String(phase).padStart(2, "0")}`);
export const getGemBaseAsset = (element) => asset(`GEM_${element}`);
export const getGemSpecialAsset = (type, element) =>
  asset(
    ["LINE_HORIZONTAL", "LINE_VERTICAL"].includes(type)
      ? `GEM_${element}_${type === "LINE_HORIZONTAL" ? "LINE_H" : "LINE_V"}`
      : `GEM_SPECIAL_${type}`,
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
export const getStageBattleBackground = (stage) =>
  getBattleBackground(resolveBattleBackground(stage).assetKey);
export const getRealmIcon = (realm) =>
  asset(REALMS.find((r) => r.id === realm)?.iconAsset || `ICON_${realm}`);
export function stageAssets(id = "1-1") {
  const s = STAGES[id];
  return [
    ...new Set([
      ...COMMON_HUD_ASSETS.map(getHudAsset).filter(Boolean),
      ...BATTLE_CONTROL_ASSETS.map(getHudAsset).filter(Boolean),
      ...s.team.map((h) => getHeroAsset(h, "avatar")),
      ...s.team.map((h) => getHeroUltimateAsset(h, { warn: false }).url),
      ...s.waves
        .flat()
        .flatMap((e) => ["idle", "attack"].map((t) => getEnemyAsset(e.id, t))),
      ...ELEMENTS.map(getGemBaseAsset),
      ...ELEMENTS.flatMap((element) =>
        ["LINE_HORIZONTAL", "LINE_VERTICAL"].map((type) =>
          getGemSpecialAsset(type, element),
        ),
      ),
      ...["BOMB", "PRISM"].map((type) => getGemSpecialAsset(type)),
      ...s.hazards.map(getGemHazardAsset),
      getStageBattleBackground(s),
      getRealmBoardFrame(s.realm),
    ]),
  ];
}
