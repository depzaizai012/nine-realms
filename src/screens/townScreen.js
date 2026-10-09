import { getBattleBackground } from "../data/assets/manifest.js";
import { STAGES } from "../data/stages/index.js";
export function mountTown(app, stageId = "1-1", onBattle, onStageSelect) {
  app.innerHTML = `<main class="game town-screen" style="background-image:url('${getBattleBackground(STAGES[stageId].background)}')"><section><p>NINE REALMS</p><h1>Town</h1><p>The town hub is under construction.</p><button class="primary">Return to Stage ${stageId}</button><a href="/" class="stage-select-link">Stage Select</a></section></main>`;
  app.querySelector(".primary").onclick = onBattle;
  app.querySelector(".stage-select-link").onclick = (event) => { event.preventDefault(); onStageSelect?.(); };
  return {
    destroy() {
      app.replaceChildren();
    },
  };
}
