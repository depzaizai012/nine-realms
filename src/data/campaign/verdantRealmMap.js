export const VERDANT_STAGE_MAP = {
  realmId: "VERDANT_REALM",
  background: "/assets/stage-select/realms/verdant/STAGE_SELECT_VERDANT_BG.png",
  imageRatio: 1024 / 1792,
  stages: [
    ["1-1","Kẻ Không Ký Ức","Outskirts","NORMAL",52,91,1000],
    ["1-2","Làng Lá Xanh","Village","NORMAL",61,81,1250],
    ["1-3","Con Đường Rễ Cây","Root Path","NORMAL",48,72,1550],
    ["1-4","Khu Rừng Thì Thầm","Deep Forest","NORMAL",37,61,1900],
    ["1-5","Hang Nhện Độc","Spider Cave","NORMAL",49,51,2350],
    ["1-6","Cuộc Chiến Hai Tộc","Conflict","NORMAL",56,42,2900],
    ["1-7","Cây Cổ Bị Nguyền","Corrupted Forest","ELITE",70,35,3600],
    ["1-8","Đền Mộc Thần","Temple","ELITE",52,27,4400],
    ["1-9","Trái Tim Khu Rừng","Heart","ELITE",43,19,5400],
    ["1-10","Cổ Thụ Vương","Sanctuary","BOSS",52,10,6800],
  ].map(([id,name,zone,type,x,y,power]) => ({ id,name,zone,type,x,y,power })),
};
export const STAGE_MAP_IDS = VERDANT_STAGE_MAP.stages.map(s=>s.id);
