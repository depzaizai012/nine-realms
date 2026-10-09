import { mountBattle } from "../screens/battleScreen.js";
import { mountTown } from "../screens/townScreen.js";
import { mountStageSelect } from "../screens/stageSelectScreen.js";
import { recordStageVictory } from "./progression/gameSaveService.js";

export function createGameRouter(app) {
  let current;
  let screen = "STAGE_SELECT";
  const startBattle = (id = "1-1") => {
    current?.destroy();
    screen = "BATTLE";
    current = mountBattle(app, id, {
      onReplay: () => startBattle(id),
      onTown: () => showTown(id),
      onStageSelect: () => showStageSelect(),
      onVictory: (result) => recordStageVictory(id, result),
    });
    return current;
  };
  const showStageSelect = (realm = "VERDANT_REALM") => {
    current?.destroy();
    screen = "STAGE_SELECT";
    current = mountStageSelect(app, {
      onBack: () => showTown(),
      onBattle: (id) => startBattle(id),
    }, realm);
    return current;
  };
  const showTown = (id = "1-1") => {
    current?.destroy();
    screen = "TOWN";
    current = mountTown(app, id, () => startBattle(id), () => showStageSelect());
    return current;
  };
  return {
    startBattle,
    showTown,
    showStageSelect,
    get screen() {
      return screen;
    },
  };
}
