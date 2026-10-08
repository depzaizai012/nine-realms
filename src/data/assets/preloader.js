import {
  stageAssets,
  COMMON_HUD_ASSETS,
  BATTLE_CONTROL_ASSETS,
  MANIFEST,
  markHudAssetFailed,
} from "./manifest.js";
const loadedImages = new Map();
export async function preloadStage() {
  return Promise.all(
    stageAssets().map(
      (url) =>
        loadedImages.get(url) ||
        (() => {
          const promise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => {
              const hud = [...COMMON_HUD_ASSETS, ...BATTLE_CONTROL_ASSETS].find(
                (key) => MANIFEST[key] === url,
              );
              if (hud) markHudAssetFailed(hud);
              else console.warn(`Missing stage asset: ${url}`);
              resolve(false);
            };
            img.src = url;
          });
          loadedImages.set(url, promise);
          return promise;
        })(),
    ),
  );
}
