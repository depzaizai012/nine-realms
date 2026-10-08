import { getBattleBackground } from "../data/assets/manifest.js";
import { STAGES } from "../data/stages/index.js";
export function mountTown(app, stageId, onBattle) {
  app.innerHTML = `<main class="game town-screen" style="background-image:url('${getBattleBackground(STAGES[stageId].background)}')"><section><p>NINE REALMS</p><h1>Town</h1><p>The town hub is under construction.</p><button class="primary">Return to Stage ${stageId}</button></section></main>`;
  app.querySelector("button").onclick = onBattle;
  return {
    destroy() {
      app.replaceChildren();
    },
  };
}
