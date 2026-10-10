import { mountBattle } from "../screens/battleScreen.js";
import { mountTown } from "../screens/townScreen.js";
import { mountStageSelect } from "../screens/stageSelectScreen.js";
import { completeStage, nextStage } from "./campaign/campaignProgress.js";
import { STAGES } from "../data/stages/index.js";
export function createGameRouter(app) {
  let current,screen = "STAGE_SELECT", selectedStage = "1-1";
  const leave=()=>{current?.destroy();current=null;};
  const showStageSelect=(focusStage=selectedStage)=>{
    leave(); screen="STAGE_SELECT";
    current=mountStageSelect(app,{onBack:()=>showTown(),onBattle:startBattle,focusStage});
    return current;
  };
  const startBattle=(id="1-1")=>{
    if (!STAGES[id]?.waves?.length) return showStageSelect(id);
    leave();screen="BATTLE";selectedStage=id;
    current=mountBattle(app,id,{
      onReplay:()=>startBattle(id),
      onTown:()=>showStageSelect(id),
      onResult:(won,state)=>{
        if(won)completeStage(id,1);
      },
      onStageSelect:()=>showStageSelect(nextStage(id)||id),
    });
    return current;
  };
  const showTown=()=>{
    leave();screen="TOWN";
    current=mountTown(app,selectedStage,()=>showStageSelect(selectedStage));
    return current;
  };
  return {startBattle,showTown,showStageSelect,get screen(){return screen;}};
}
