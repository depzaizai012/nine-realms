import { STAGE_MAP_IDS } from "../../data/campaign/verdantRealmMap.js";
const KEY = "nine-realms:campaign:v1";
function clean(data) {
  const cleared = Array.isArray(data?.clearedStages) ? data.clearedStages.filter(x=>STAGE_MAP_IDS.includes(x)) : [];
  return { clearedStages:[...new Set(cleared)], bestStars: data?.bestStars && typeof data.bestStars==="object" ? data.bestStars : {}, claimedFirstClear: Array.isArray(data?.claimedFirstClear) ? data.claimedFirstClear : [] };
}
export function readCampaign() {
  try { return clean(JSON.parse(localStorage.getItem(KEY))); }
  catch { return clean(null); }
}
export function saveCampaign(data) {
  const value=clean(data);
  try { localStorage.setItem(KEY,JSON.stringify(value)); }
  catch(e){ console.warn("Campaign progress could not be saved",e); }
  return value;
}
export function stageState(id, campaign=readCampaign()) {
  const index=STAGE_MAP_IDS.indexOf(id);
  if(index<0)return "LOCKED";
  if(campaign.clearedStages.includes(id))return "CLEARED";
  return index===0 || campaign.clearedStages.includes(STAGE_MAP_IDS[index-1]) ? "CURRENT" : "LOCKED";
}
export function nextStage(id) { return STAGE_MAP_IDS[STAGE_MAP_IDS.indexOf(id)+1] ?? null; }
export function completeStage(id,stars=1) {
  if(!STAGE_MAP_IDS.includes(id))throw new Error("Unknown stage: "+id);
  const progress=readCampaign();
  const firstClear=!progress.clearedStages.includes(id);
  if(firstClear)progress.clearedStages.push(id);
  progress.bestStars[id]=Math.max(progress.bestStars[id] || 0,Math.min(3,Math.max(1,stars)));
  // Rewards are NOT granted here: requires an authoritative rewards pipeline.
  return {progress:saveCampaign(progress),firstClear,next:nextStage(id)};
}
