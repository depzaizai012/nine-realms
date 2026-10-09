import { HEROES } from "../data/heroes/index.js";
import { MANIFEST } from "../data/assets/manifest.js";
import { STARTER_HERO_IDS, STARTER_SUMMON_ID } from "../data/starterRoster.js";
import "../styles/starterSummon.css";

const SAVE_KEY = "nine-realms:starter-roster:v1";
export function grantStarterHeroes(storage) {
  // Idempotent so replaying the cutscene does not grant duplicates.
  let record = { summonId: STARTER_SUMMON_ID, heroIds: [] };
  try {
    const existing = JSON.parse(storage.getItem(SAVE_KEY) || "null");
    if (existing && Array.isArray(existing.heroIds)) {
      record.heroIds = existing.heroIds.filter((id) => typeof id === "string");
    }
  } catch { /* New player / unavailable browser storage. */ }
  record.heroIds = [...new Set([...record.heroIds, ...STARTER_HERO_IDS])];
  record.grantedAt ||= Date.now();
  try { storage.setItem(SAVE_KEY, JSON.stringify(record)); } catch { /* Story remains playable offline. */ }
  return record;
}

export function mountStarterSummon(app, { onComplete } = {}) {
  const controller = new AbortController();
  const pending = new Set();
  let summoned = false;
  const heroes = STARTER_HERO_IDS.map(id => HEROES[id]);
  if (heroes.some(h => !h)) throw new Error("Starter summon refers to an undefined Hero");
  app.innerHTML = `<main class="starter-screen" aria-label="Triệu hồi tân thủ">
    <div class="starter-sky" aria-hidden="true"></div>
    <header><p>CỬU GIỚI TÂM · NGHI THỨC ĐẦU TIÊN</p>
      <h1>THỨC TỈNH ANH HÙNG</h1><span>CHAPTER I — THANH MỘC GIỚI</span></header>
    <div class="starter-crystal" aria-hidden="true"><span>✦</span></div>
    <section class="starter-story">
      <strong>Ly</strong>
      <p>Mảnh Giới Tinh lưu giữ dấu ấn của những chiến binh cổ đại... Anh hãy thử đánh thức họ!</p>
    </section>
    <section class="starter-grid" aria-label="Năm Lưu Ảnh tân thủ">
      ${heroes.map((h, i) => `<article class="starter-card" data-index="${i}" aria-label="${h.name}">
        <div class="starter-card-inner">
          <div class="starter-face starter-back"><span>✧</span><small>${i+1}/5</small></div>
          <div class="starter-face starter-front">
            <img src="${MANIFEST[h.assetId + "_AVATAR"] || ""}" alt="${h.name}">
            <div class="starter-grade ${h.rarity.toLowerCase()}">${h.rarity}</div>
            <strong>${h.name}</strong>
            <small>${({TANK:"Đỡ đòn",SUPPORT:"Hỗ trợ",MAGE:"Pháp sư",WARRIOR:"Kiếm sĩ"})[h.role]}</small>
          </div>
        </div>
      </article>`).join("")}
    </section>
    <footer class="starter-actions">
      <button class="starter-main-button" data-action="summon">TRIỆU HỒI 5 HERO · MIỄN PHÍ</button>
      <p class="starter-notice">Bảo đảm 2 SR + 3 R · Không ngẫu nhiên · Không cần kim cương</p>
    </footer>
  </main>`;
  const root = app.querySelector(".starter-screen");
  const button = root.querySelector(".starter-main-button");
  const story = root.querySelector(".starter-story p");
  function after(fn, time) {
    const handle = setTimeout(() => { pending.delete(handle); fn(); }, time);
    pending.add(handle);
  }
  function summon() {
    if (summoned) return;
    summoned = true;
    button.disabled = true;
    grantStarterHeroes(window.localStorage);
    root.classList.add("starter-summoning");
    story.textContent = "Năm luồng sáng đã đáp lại lời triệu hồi... Khế Ước Lưu Ảnh được hình thành!";
    root.querySelectorAll(".starter-card").forEach((card, i) => {
      after(() => card.classList.add("revealed"), 450 + i * 470);
    });
    after(() => {
      button.disabled = false;
      button.dataset.action = "continue";
      button.textContent = "VÀO TRẬN 1-1 — KẺ KHÔNG KÝ ỨC ›";
      root.querySelector(".starter-notice").textContent = "Đội hình R/SR đã nhận. Aria và Fenrir SSR sẽ xuất hiện trong những phần truyện sau.";
    }, 450 + heroes.length * 470);
  }
  root.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.action;
    if (action === "summon") summon();
    if (action === "continue") onComplete?.();
  }, {signal: controller.signal});
  return {
    summon,
    destroy() {
      controller.abort();
      for (const timer of pending) clearTimeout(timer);
      pending.clear();
      root.remove();
    }
  };
}
