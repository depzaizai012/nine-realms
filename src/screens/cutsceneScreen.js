import { CHAPTER_ONE_CUTSCENES } from "../data/story/chapter1.js";
import { MANIFEST } from "../data/assets/manifest.js";
import "../styles/cutscene.css";

// Deliberately no gameplay or boss simulation: this is the cinematic presenter.
function characterArt(kind) {
  if (kind === "ly") return `<svg viewBox="0 0 260 400" role="img" aria-label="Ly, cô gái tóc bạc">
    <defs><linearGradient id="lycloak" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e5fff0"/><stop offset="1" stop-color="#487d72"/></linearGradient>
    <linearGradient id="lyhair" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#87bbbf"/></linearGradient></defs>
    <ellipse cx="130" cy="381" rx="100" ry="13" fill="#5cf8b0" opacity=".23"/>
    <path d="M67 145Q39 91 96 48Q165 1 206 73Q227 128 191 285L70 275Z" fill="url(#lyhair)"/>
    <path d="M45 388Q54 264 95 235L169 234Q216 254 231 388Z" fill="url(#lycloak)" stroke="#dbffde" stroke-width="3"/>
    <path d="M90 255L130 318L172 254L159 234H105Z" fill="#286454"/>
    <path d="M104 198H157V254Q134 275 104 253Z" fill="#e9c3a9"/>
    <path d="M86 102Q79 184 99 223Q131 257 168 220Q190 173 172 98Q140 67 86 102Z" fill="#f5d8c2"/>
    <path d="M84 115Q86 51 136 51Q178 46 188 119Q166 112 151 86Q130 112 84 115Z" fill="url(#lyhair)"/>
    <path d="M90 97Q65 159 65 280L83 299Q93 197 104 129Z" fill="url(#lyhair)"/>
    <path d="M171 101Q201 180 188 292L208 276Q217 150 183 88Z" fill="url(#lyhair)"/>
    <path d="M104 174Q114 169 123 175M143 175Q153 169 162 174" stroke="#326458" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M124 207Q133 213 143 207" stroke="#aa796a" stroke-width="2" fill="none"/>
    <path d="M91 255L129 319L169 254" fill="none" stroke="#bafce0" stroke-width="4"/>
    <path d="M129 307L139 324L129 343L118 324Z" fill="#b7ffde" stroke="#fff" stroke-width="2"/></svg>`;
  if (kind === "wanderer") return `<svg viewBox="0 0 260 400" role="img" aria-label="Người lữ hành bí ẩn">
    <defs><linearGradient id="armor" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#2d665d"/><stop offset="1" stop-color="#0a2028"/></linearGradient></defs>
    <ellipse cx="128" cy="382" rx="110" ry="14" fill="#49e2a4" opacity=".18"/>
    <path d="M30 394Q46 248 90 201L174 196Q222 237 238 394Z" fill="#172c31" stroke="#75ae92" stroke-width="3"/>
    <path d="M86 206Q54 142 81 75Q106 35 140 33Q189 37 202 101Q213 147 177 206Z" fill="url(#armor)" stroke="#8aaf90" stroke-width="3"/>
    <path d="M90 122Q125 110 174 121L167 197Q129 227 99 193Z" fill="#1b302c"/>
    <path d="M93 145Q126 139 171 145" stroke="#9bccbd" opacity=".75" stroke-width="3"/>
    <path d="M79 237L126 270L181 231L208 271L175 386H81L52 267Z" fill="#274e48" stroke="#aacaa9" stroke-width="4"/>
    <path d="M128 271V387M88 283L127 302L173 282" stroke="#b9d58f" stroke-width="3" opacity=".65"/>
    <path d="M62 295Q38 331 32 393M207 289Q225 335 225 391" stroke="#6d9e8c" stroke-width="13" stroke-linecap="round"/>
  </svg>`;
  if (kind === "crystal") return `<svg viewBox="0 0 260 400" role="img" aria-label="Mảnh Giới Tinh phát sáng">
    <defs><linearGradient id="gem" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5fff0"/><stop offset=".45" stop-color="#87f9cd"/><stop offset="1" stop-color="#1b9e8d"/></linearGradient></defs>
    <circle cx="130" cy="198" r="102" fill="#46f6c4" opacity=".10"/>
    <circle cx="130" cy="198" r="72" fill="#a3fff4" opacity=".18"/>
    <path d="M128 78L194 161L171 270L129 323L75 260L60 159Z" fill="url(#gem)" stroke="#e7ffdf" stroke-width="4"/>
    <path d="M128 78L129 323M60 159L194 161L129 216L75 260M129 216L171 270" fill="none" stroke="#e5ffeb" stroke-opacity=".7" stroke-width="3"/>
    <g fill="#d0ffe8"><circle cx="43" cy="102" r="4"/><circle cx="211" cy="254" r="3"/><circle cx="45" cy="302" r="5"/><circle cx="214" cy="117" r="4"/></g>
  </svg>`;
  if (kind === "portal") return `<svg viewBox="0 0 260 400" role="img" aria-label="Cổng Xích Viêm đang mở">
    <defs><radialGradient id="portal"><stop stop-color="#ffe9a9"/><stop offset=".4" stop-color="#ff9c50"/><stop offset=".8" stop-color="#b3352f"/><stop offset="1" stop-color="#381222"/></radialGradient></defs>
    <ellipse cx="130" cy="205" rx="95" ry="155" fill="url(#portal)"/>
    <ellipse cx="130" cy="205" rx="92" ry="155" fill="none" stroke="#ffbc66" stroke-width="12" stroke-dasharray="34 12"/>
    <ellipse cx="130" cy="205" rx="66" ry="129" fill="none" stroke="#fff0b8" stroke-width="4" opacity=".75"/>
    <path d="M90 300Q111 211 130 230Q166 123 183 282" fill="none" stroke="#ffe3ab" stroke-width="7" opacity=".6"/>
  </svg>`;
  return "";
}
export function mountCutscene(app, kind, navigation = {}) {
  const scene = CHAPTER_ONE_CUTSCENES[kind];
  if (!scene) throw new Error(`Unknown story cutscene: ${kind}`);
  const abort = new AbortController();
  let shotIndex = 0, dialogueIndex = 0, timer, auto = true, muted = true, finished = false;
  app.innerHTML = `<main class="story-screen" aria-label="Cutscene ${scene.id}">
    <div class="story-frame">
      <div class="story-background"></div><div class="story-vignette"></div>
      <div class="story-motes" aria-hidden="true"></div><div class="story-character" aria-hidden="true"></div>
      <header class="story-head"><span class="story-chapter"></span><span class="story-step"></span></header>
      <div class="story-middle"><p class="story-shot-label"></p></div>
      <section class="story-caption" aria-live="polite"><div class="story-speaker"></div><p class="story-dialogue"></p><span class="story-hint">CHẠM ĐỂ TIẾP TỤC ›</span></section>
      <div class="story-progress"></div>
      <footer class="story-toolbar">
        <button type="button" data-action="replay" aria-label="Phát lại từ đầu">↺ <span>Phát lại</span></button>
        <button type="button" data-action="auto" aria-pressed="true">▶ <span>Tự động: Bật</span></button>
        <button type="button" data-action="sound" aria-pressed="false">♪ <span>Âm thanh: Tắt</span></button>
        <button type="button" data-action="skip">Bỏ qua »</button>
      </footer>
    </div>
  </main>`;
  const root = app.querySelector(".story-screen");
  const background = root.querySelector(".story-background");
  const figure = root.querySelector(".story-character");
  const caption = root.querySelector(".story-caption");
  const progress = root.querySelector(".story-progress");
  const speaker = root.querySelector(".story-speaker");
  const line = root.querySelector(".story-dialogue");
  let audioContext = null, ambience = null;
  function beep() {
    if (muted) return;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      audioContext ||= new AudioCtor();
      if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
      const tone = audioContext.createOscillator(), gain = audioContext.createGain(), now = audioContext.currentTime;
      tone.type = "sine";
      tone.frequency.setValueAtTime(kind === "ending" ? 245 : 330, now);
      tone.frequency.exponentialRampToValueAtTime(kind === "ending" ? 175 : 270, now + .22);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.026, now + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .28);
      tone.connect(gain).connect(audioContext.destination);
      tone.start(now); tone.stop(now + .3);
    } catch { /* Optional browser audio; presentation works without it. */ }
  }
  function clearScheduled() { clearTimeout(timer); timer = null; }
  function schedule() {
    clearScheduled();
    if (!auto || finished) return;
    const shot = scene.shots[shotIndex];
    const delay = Math.max(1800, Math.round(shot.duration / shot.dialogue.length));
    timer = setTimeout(advance, delay);
  }
  function renderDialogue() {
    const entry = scene.shots[shotIndex].dialogue[dialogueIndex];
    speaker.textContent = entry.name;
    line.textContent = entry.text;
    caption.classList.remove("story-caption--enter");
    void caption.offsetWidth;
    caption.classList.add("story-caption--enter");
    beep();
    schedule();
  }
  function renderShot() {
    const shot = scene.shots[shotIndex];
    root.dataset.mood = shot.mood;
    root.dataset.motion = shot.movement;
    background.style.backgroundImage = `url("${MANIFEST[shot.background] || MANIFEST.BG_W01_WHISPERING_FOREST}")`;
    // Replacing the figure re-triggers its entrance animation each shot.
    if (shot.figure === "boss") figure.innerHTML = `<img src="${MANIFEST.BOSS_W01_THORNHEART_PHASE_01}" alt="">`;
    else if (shot.figure === "aria") figure.innerHTML = `<img src="${MANIFEST.HERO_001_ARIA_FULL_BODY}" alt="">`;
    else figure.innerHTML = characterArt(shot.figure);
    figure.dataset.figure = shot.figure;
    root.querySelector(".story-chapter").textContent = scene.chapter;
    root.querySelector(".story-step").textContent = `${String(shotIndex + 1).padStart(2, "0")} / ${String(scene.shots.length).padStart(2, "0")}`;
    root.querySelector(".story-shot-label").textContent = shot.title;
    progress.style.width = `${(shotIndex / scene.shots.length) * 100}%`;
    renderDialogue();
  }
  function showEndingReward() {
    finished = true;
    clearScheduled();
    root.classList.add("story-complete");
    root.querySelector(".story-middle").innerHTML = `<div class="story-reward">
      <div class="story-reward-gem">✦</div>
      <p>CHAPTER I COMPLETE</p><h1>THANH MỘC GIỚI</h1>
      <p>Giới Tinh Thanh Mộc đã được giải phóng</p>
      <strong>GIỚI TINH · 1 / 8</strong>
      <small>Chapter II — Xích Viêm Giới · Chưa mở trong bản game hiện tại</small>
      <div class="story-reward-actions"><button type="button" data-action="again">Xem lại cutscene</button>
      <button type="button" data-action="done">Trở về màn 1-1</button></div>
    </div>`;
    caption.hidden = true;
    progress.style.width = "100%";
    root.querySelector(".story-toolbar").hidden = true;
  }
  function complete() {
    clearScheduled();
    if (kind === "ending") showEndingReward();
    else navigation.onComplete?.();
  }
  function advance() {
    if (finished) return;
    clearScheduled();
    if (dialogueIndex < scene.shots[shotIndex].dialogue.length - 1) {
      dialogueIndex++;
      renderDialogue();
    } else if (shotIndex < scene.shots.length - 1) {
      shotIndex++; dialogueIndex = 0;
      renderShot();
    } else complete();
  }
  function restart() {
    clearScheduled(); finished = false;
    shotIndex = 0; dialogueIndex = 0;
    root.classList.remove("story-complete");
    root.querySelector(".story-middle").innerHTML = `<p class="story-shot-label"></p>`;
    caption.hidden = false;
    root.querySelector(".story-toolbar").hidden = false;
    renderShot();
  }
  root.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.action;
    if (action === "replay" || action === "again") restart();
    else if (action === "auto") {
      auto = !auto;
      const button = root.querySelector('[data-action="auto"]');
      button.setAttribute("aria-pressed", String(auto));
      button.querySelector("span").textContent = `Tự động: ${auto ? "Bật" : "Tắt"}`;
      schedule();
    } else if (action === "sound") {
      muted = !muted;
      const button = root.querySelector('[data-action="sound"]');
      button.setAttribute("aria-pressed", String(!muted));
      button.querySelector("span").textContent = `Âm thanh: ${muted ? "Tắt" : "Bật"}`;
      if (!muted) beep();
    } else if (action === "skip") complete();
    else if (action === "done") navigation.onComplete?.();
    else if (!event.target.closest(".story-toolbar") && !finished) advance();
  }, { signal: abort.signal });
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "Enter" || event.code === "ArrowRight") {
      if (event.target instanceof HTMLButtonElement) return;
      event.preventDefault();
      advance();
    }
    if (event.code === "Escape") complete();
  }, { signal: abort.signal });
  renderShot();
  return {
    advance, restart,
    destroy() {
      clearScheduled();
      abort.abort();
      audioContext?.close().catch(() => {});
      root.remove();
    },
  };
}
