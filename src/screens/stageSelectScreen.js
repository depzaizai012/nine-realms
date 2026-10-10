import { VERDANT_STAGE_MAP } from "../data/campaign/verdantRealmMap.js";
import { readCampaign, stageState } from "../core/campaign/campaignProgress.js";
import { STAGES } from "../data/stages/index.js";
import "../styles/stage-select.css";
const ASSET="/assets/stage-select/shared/";
const nodeAsset=(s,status)=>status==="LOCKED"?"UI_STAGE_NODE_LOCKED.png":s.type==="BOSS"?"UI_STAGE_NODE_BOSS.png":s.type==="ELITE"?"UI_STAGE_NODE_ELITE.png":status==="CLEARED"?"UI_STAGE_NODE_CLEARED.png":"UI_STAGE_NODE_CURRENT.png";
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
export function mountStageSelect(app,{onBack,onBattle,focusStage}={}) {
  const progress=readCampaign();
  const stages=VERDANT_STAGE_MAP.stages;
  const image=VERDANT_STAGE_MAP.background;
  app.innerHTML=`<main class="stage-select"><header class="ss-header"><button class="ss-back" aria-label="Back">‹</button><h1>Verdant Realm</h1></header><div class="ss-scroll"><div class="ss-map" style="background-image:url('${image}')"><svg class="ss-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${stages.map(s=>s.x+','+s.y).join(' ')}" /></svg>${stages.map(s=>{const status=stageState(s.id,progress);return `<button class="ss-node ${status.toLowerCase()}" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%" aria-label="Stage ${s.id}, ${escapeHTML(s.name)}, ${status}"><img src="${ASSET}nodes/${nodeAsset(s,status)}" alt="" /><span>${s.id}</span><span class="ss-stars">${status==="CLEARED" ? "★".repeat(progress.bestStars[s.id]||1)+"☆".repeat(3-(progress.bestStars[s.id]||1)) : "☆☆☆"}</span></button>`}).join('')}</div></div><div class="ss-shade" hidden><section class="ss-detail" role="dialog" aria-modal="true" aria-labelledby="ss-stage-title"><button class="ss-close" aria-label="Close">×</button><div class="ss-detail-body"></div></section></div></main>`;
  const root=app.querySelector(".stage-select"),scroll=root.querySelector(".ss-scroll"),shade=root.querySelector(".ss-shade");
  const close=()=>{shade.hidden=true;};
  root.querySelector(".ss-back").onclick=()=>onBack?.();
  root.querySelector(".ss-close").onclick=close;
  shade.addEventListener("click",e=>{if(e.target===shade)close();});
  root.querySelectorAll(".ss-node").forEach(button=>button.onclick=()=>{
    const s=stages.find(x=>x.id===button.dataset.id),status=stageState(s.id,readCampaign()),playable=Boolean(STAGES[s.id]?.waves?.length);
    shade.querySelector(".ss-detail-body").innerHTML=`<div class="ss-type">${s.type}</div><h2 id="ss-stage-title">${s.id} · ${escapeHTML(s.name)}</h2><p>${escapeHTML(s.zone)} · 3 waves planned</p><p>Recommended Power: ${s.power.toLocaleString("en-US")}</p><p>${status==="LOCKED"?"Complete the previous stage to unlock.":!playable?"Battle encounter for this stage is not implemented yet.":"Battle ready"}</p><button class="ss-enter" ${status==="LOCKED"||!playable?"disabled":""}>${status==="CLEARED"?"Replay":"Battle"}</button>`;
    shade.querySelector(".ss-enter").onclick=()=>{if(status!=="LOCKED"&&playable)onBattle?.(s.id);};
    shade.hidden=false;
  });
  const focus=stages.find(s=>s.id===focusStage)||[...stages].reverse().find(s=>stageState(s.id,progress)==="CURRENT")||stages[0];
  requestAnimationFrame(()=>{scroll.scrollTop=Math.max(0,(focus.y/100)*root.querySelector(".ss-map").offsetHeight-scroll.clientHeight*.72);});
  return {destroy(){root.remove();}};
}
