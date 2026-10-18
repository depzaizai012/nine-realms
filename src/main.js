import "./styles/base.css";
import "./core/vfx/battle-vfx.css";
import { createGameRouter } from "./core/appRouter.js";
import { preloadStage } from "./data/assets/preloader.js";
import { installAssetFallbacks } from "./data/assets/manifest.js";
installAssetFallbacks(document.querySelector("#app"));
if (import.meta.env.DEV && window.location.pathname === "/dev/vfx-studio") {
  const { mountVfxStudio } = await import("./screens/vfxStudioScreen.js");
  window.__vfxStudio = mountVfxStudio(document.querySelector("#app"));
} else {
  await preloadStage();
  const router = createGameRouter(document.querySelector("#app"));
  router.startBattle();
  if (import.meta.env.DEV) window.__gameRouter = router;
}
