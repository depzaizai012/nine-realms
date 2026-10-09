import { mountBattle } from "../screens/battleScreen.js";
import { mountTown } from "../screens/townScreen.js";
import { mountCutscene } from "../screens/cutsceneScreen.js";
import { mountStarterSummon } from "../screens/starterSummonScreen.js";

export function createGameRouter(app) {
  let current, screen = "BATTLE";
  const startBattle = (id = "1-1") => {
    current?.destroy();
    screen = "BATTLE";
    current = mountBattle(app, id, {
      onReplay: () => startBattle(id),
      onTown: () => showTown(id),
    });
    return current;
  };
  const showTown = (id = "1-1") => {
    current?.destroy();
    screen = "TOWN";
    current = mountTown(app, id, () => startBattle(id));
    return current;
  };
  const showStarterSummon = () => {
    current?.destroy();
    screen = "STARTER_SUMMON";
    current = mountStarterSummon(app, { onComplete: () => startBattle("1-1") });
    return current;
  };
  const playIntro = () => {
    current?.destroy();
    screen = "CUTSCENE_INTRO";
    current = mountCutscene(app, "intro", { onComplete: () => showStarterSummon() });
    return current;
  };
  const playEnding = () => {
    current?.destroy();
    screen = "CUTSCENE_ENDING";
    // Chapter I's 1-10 boss is not implemented. This is a story preview, not a clear reward.
    current = mountCutscene(app, "ending", { onComplete: () => startBattle("1-1") });
    return current;
  };
  const start = () => {
    const preview = new URLSearchParams(window.location.search).get("cutscene");
    if (preview === "intro") return playIntro();
    if (preview === "ending") return playEnding();
    if (new URLSearchParams(window.location.search).get("summon") === "starter") return showStarterSummon();
    // Preserve the existing one-stage battle experience and browser tests.
    return startBattle("1-1");
  };
  return {
    start, startBattle, showTown, playIntro, playEnding, showStarterSummon,
    get screen() { return screen; },
  };
}
