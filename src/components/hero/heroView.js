import { getHeroAsset, getGemBaseAsset } from "../../data/assets/manifest.js";
import { HERO_HUD_CONFIG as C } from "../../data/heroHudConfig.js";
import { getHeroVitals } from "./heroHudState.js";
import { createStatusView, hudImage } from "./statusView.js";
import "../../styles/hero-hud.css";

export function createHeroView(root, heroes, onUltimate) {
  const cards = new Map(),
    previousReady = new Map(),
    previousHp = new Map(),
    statusViews = new Map();
  const formatter = new Intl.NumberFormat("en-US");
  root.classList.add("production-hero-hud");
  root.style.setProperty("--hero-frame-art-scale", C.frameArtScale);
  root.style.setProperty("--hero-ult-glow-opacity", C.glowOpacity);
  for (const [name, ms] of Object.entries(C.timings))
    root.style.setProperty(
      `--hud-${name.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}`,
      `${ms}ms`,
    );
  for (const [name, value] of Object.entries(C.barArt))
    root.style.setProperty(`--bar-art-${name}`, `${value}%`);
  for (const [channel, layout] of Object.entries(C.barChannels))
    for (const [name, value] of Object.entries(layout))
      root.style.setProperty(`--${channel}-${name}`, `${value}%`);
  for (const hero of heroes) {
    const card = document.createElement("button");
    card.className = "hero-card";
    card.dataset.actor = hero.id;
    card.innerHTML =
      '<div class="status-container" hidden></div><div class="avatar-wrap hero-portrait-area"><img class="avatar hero-avatar" alt=""><span class="frame-fallback"></span></div><b class="hero-name"></b><div class="hero-bars"><div class="bar hp"><i class="trail"></i><i class="fill hp-fill"></i><span class="hp-text"></span></div><div class="bar energy"><i class="fill mana-fill"></i></div></div>';
    const portrait = card.querySelector(".avatar-wrap"),
      avatar = card.querySelector(".avatar");
    avatar.src = getHeroAsset(hero.assetId, "avatar");
    avatar.alt = hero.name;
    avatar.draggable = false;
    portrait.append(
      hudImage(card, "HUD_HERO_FRAME_NORMAL", "hero-frame hero-frame-normal"),
      hudImage(card, "HUD_HERO_FRAME_ULT_READY", "hero-frame hero-frame-ready"),
    );
    const element = document.createElement("img");
    element.className = "element hero-element-icon";
    element.src = getGemBaseAsset(hero.element);
    element.alt = hero.element;
    element.draggable = false;
    portrait.append(element);
    const glow = hudImage(
      card,
      "HUD_HERO_ULT_GLOW_OVERLAY",
      "hero-ultimate-glow",
    );
    portrait.append(glow);
    card.querySelector(".hero-name").textContent = hero.name;
    card
      .querySelector(".hero-bars")
      .prepend(hudImage(card, "HUD_HERO_BAR_BG", "hero-bar-bg"));
    card.onclick = () => {
      if (!card.disabled) onUltimate(hero.id);
    };
    // The class starts only on a readiness edge; rerenders cannot replay it.
    glow.addEventListener("animationend", (event) => {
      if (event.animationName === "hero-ready-arrival")
        card.classList.remove("ready-arrival");
    });
    statusViews.set(
      hero.id,
      createStatusView(card, card.querySelector(".status-container")),
    );
    root.append(card);
    cards.set(hero.id, card);
  }
  return {
    render(currentHeroes) {
      for (const hero of currentHeroes) {
        const card = cards.get(hero.id),
          v = getHeroVitals(hero),
          wasReady = previousReady.get(hero.id) ?? false;
        card.classList.toggle("dead", !v.alive);
        card.classList.toggle("charged", v.ready);
        card.dataset.hpTone = v.hpTone;
        card.dataset.ready = String(v.ready);
        card.disabled = !v.alive;
        if (v.ready && !wasReady) {
          card.dataset.readyTransitions = String(
            Number(card.dataset.readyTransitions || 0) + 1,
          );
          if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
            card.classList.add("ready-arrival");
        }
        if (!v.ready) card.classList.remove("ready-arrival");
        previousReady.set(hero.id, v.ready);
        const hp = card.querySelector(".hp");
        hp.dataset.tone = v.hpTone;
        hp.setAttribute("role", "meter");
        hp.setAttribute("aria-label", `${hero.name} HP`);
        hp.setAttribute("aria-valuemin", "0");
        hp.setAttribute("aria-valuemax", v.maxHp);
        hp.setAttribute("aria-valuenow", v.hp);
        hp.querySelector(".fill").style.width = `${v.hpRatio * 100}%`;
        const trail = hp.querySelector(".trail"),
          damage = previousHp.has(hero.id) && v.hp < previousHp.get(hero.id);
        trail.style.transition = damage
          ? "width var(--hud-hp-trail) ease var(--hud-hp-trail-delay)"
          : "width var(--hud-hp-fill) ease";
        trail.style.width = `${v.hpRatio * 100}%`;
        previousHp.set(hero.id, v.hp);
        card.querySelector(".hp-text").textContent =
          `${formatter.format(v.hp)} / ${formatter.format(v.maxHp)}`;
        card.querySelector(".energy .fill").style.width =
          `${v.manaRatio * 100}%`;
        card.setAttribute(
          "aria-label",
          `${hero.name}, ${v.hp} / ${v.maxHp} HP, ${v.mana} / ${v.maxMana} mana${v.ready ? ", activate ultimate" : ""}${!v.alive ? ", fallen" : ""}`,
        );
        statusViews.get(hero.id).render(hero);
      }
    },
  };
}
