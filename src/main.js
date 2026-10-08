import "./styles/base.css";
import "./core/vfx/battle-vfx.css";
import { mountBattle } from "./screens/battleScreen.js";
import { preloadStage } from "./data/assets/preloader.js";
import { installAssetFallbacks } from "./data/assets/manifest.js";
installAssetFallbacks(document.querySelector("#app"));
await preloadStage();
mountBattle(document.querySelector("#app"));
