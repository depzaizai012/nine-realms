import { stageAssets } from "./manifest.js";
export async function preloadStage() {
  return Promise.all(
    stageAssets().map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => {
            console.warn(`Missing stage asset: ${url}`);
            resolve(false);
          };
          img.src = url;
        }),
    ),
  );
}
