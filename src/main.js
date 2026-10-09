import "./styles/base.css";
import "./core/vfx/battle-vfx.css";
import { createGameRouter } from "./core/appRouter.js";
import { preloadStage } from "./data/assets/preloader.js";
import { installAssetFallbacks } from "./data/assets/manifest.js";
installAssetFallbacks(document.querySelector("#app"));
await preloadStage();
const router = createGameRouter(document.querySelector("#app"));
// Retain an explicit Battle entry point for deterministic legacy test suites.
// New player sessions enter the stage map first.
const requestedScreen = new URLSearchParams(window.location.search).get("screen");
if (requestedScreen === "battle" || /^\/battle\/1-1\/?$/.test(window.location.pathname)) router.startBattle();
else router.showStageSelect();
if (import.meta.env.DEV) window.__gameRouter = router;
