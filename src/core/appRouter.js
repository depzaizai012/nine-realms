import { mountBattle } from "../screens/battleScreen.js";
import { mountTown } from "../screens/townScreen.js";
export function createGameRouter(app) {
  let current,
    screen = "BATTLE";
  const startBattle = (id = "1-1") => {
    current?.destroy();
    screen = "BATTLE";
    current = mountBattle(app, id, {
      onReplay: () => startBattle(id),
      onTown: () => showTown(id),
    });
    return current;
  };
  const showTown = (id) => {
    current?.destroy();
    screen = "TOWN";
    current = mountTown(app, id, () => startBattle(id));
  };
  return {
    startBattle,
    showTown,
    get screen() {
      return screen;
    },
  };
}
