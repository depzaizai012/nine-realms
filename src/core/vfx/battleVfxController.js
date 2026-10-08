import { VFX_CONFIG as T } from "./vfxConfig.js";
import { VFX_REGISTRY } from "./vfxRegistry.js";
import { COLORS } from "../../data/elements/index.js";
import { getEnemyAsset } from "../../data/assets/manifest.js";
import { createHeroActionVfx } from "./heroActionVfxController.js";
import { createBoardVfx } from "./boardVfxController.js";

export function createVfx(root, state, boardView) {
  const layer = root.querySelector(".vfx-layer"),
    numberLayer = root.querySelector(".number-layer");
  const actor = (id) => root.querySelector(`[data-actor="${id}"]`);
  const wait = async (ms) => {
    let remaining = ms;
    while (remaining > 0) {
      const start = performance.now();
      await new Promise((r) =>
        setTimeout(
          r,
          state.paused ? T.tick : Math.min(remaining / state.speed, T.tick),
        ),
      );
      if (!state.paused) remaining -= (performance.now() - start) * state.speed;
    }
  };
  const animate = async (el, frames, ms) => {
    if (!el) return;
    const a = el.animate(frames, {
      duration: ms,
      easing: "ease-in-out",
      fill: "none",
    });
    a.playbackRate = state.speed;
    const update = () => {
      a.playbackRate = state.speed;
      if (state.paused || root.classList.contains("hit-stop")) {
        if (a.playState === "running") a.pause();
      } else if (a.playState === "paused") a.play();
    };
    update();
    const interval = setInterval(update, T.tick);
    try {
      await a.finished;
    } catch {
    } finally {
      clearInterval(interval);
    }
  };
  async function hitStop(duration) {
    const animations = root
      .getAnimations({ subtree: true })
      .filter((a) => a.playState === "running");
    root.classList.add("hit-stop");
    animations.forEach((a) => a.pause());
    await wait(duration);
    root.classList.remove("hit-stop");
    if (!state.paused)
      animations.forEach((a) => {
        if (a.playState === "paused") a.play();
      });
  }
  const center = (el, relative = root) => {
    const r = el.getBoundingClientRect(),
      p = relative.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - p.left,
      y: r.top + r.height / 2 - p.top,
    };
  };
  function effect(cls, x, y, color, targetLayer = layer) {
    const el = document.createElement("i");
    el.className = cls;
    Object.assign(el.style, {
      left: `${x}px`,
      top: `${y}px`,
      "--color": color,
    });
    targetLayer.append(el);
    return el;
  }
  async function number(
    target,
    amount,
    kind = "damage",
    crit = false,
    duration = T.number,
  ) {
    if (!target) return;
    const p = center(target),
      el = effect(
        `floating-number ${kind}`,
        p.x,
        p.y,
        kind === "damage" ? "#fff0d5" : "#a0ffc8",
        numberLayer,
      );
    el.textContent = crit
      ? `CRIT ${amount}!`
      : `${kind === "damage" ? "-" : "+"}${amount}`;
    await animate(
      el,
      [
        { transform: "translate(-50%,-20%) scale(.7)", opacity: 0 },
        {
          transform: "translate(-50%,-50%) scale(1.12)",
          opacity: 1,
          offset: 0.2,
        },
        { transform: "translate(-50%,-90%) scale(1)", opacity: 0 },
      ],
      duration,
    );
    el.remove();
  }
  async function particles(el, color, heal = false, options = {}) {
    const targetLayer = options.layer || layer,
      p = center(el, targetLayer),
      duration = options.duration || T.number,
      spread = options.spread || 32;
    await Promise.all(
      Array.from({ length: options.count || (heal ? 5 : 8) }, (_, i) => {
        const node = effect(
          heal === "shield"
            ? "shield-particle"
            : heal
              ? "heal-particle"
              : `particle ${options.style || ""}`,
          p.x,
          p.y,
          color,
          targetLayer,
        );
        if (heal) node.textContent = heal === "shield" ? "◇" : "+";
        return animate(
          node,
          [
            { opacity: 1, transform: "translate(0,0) scale(1)" },
            {
              opacity: 0,
              transform: `translate(${Math.cos(i * 2.4) * spread}px,${Math.sin(i * 2.4) * spread * 0.8 - 20}px) scale(.2)`,
            },
          ],
          duration,
        ).then(() => node.remove());
      }),
    );
  }
  async function hit(target, event, options = {}) {
    if (!target) return;
    if (options.number !== false)
      void number(target, event.amount, event.kind, event.crit);
    const duration = options.duration || T.hit;
    if (event.kind === "heal" || event.kind === "shield") {
      const color =
        event.kind === "shield"
          ? "#e2c581"
          : event.element === "LIGHT"
            ? "#ffe5a2"
            : "#9affbe";
      void particles(target, color, event.kind === "shield" ? "shield" : true, {
        duration: T.ultimateParticle,
      });
      await animate(
        target,
        [
          { filter: "brightness(1)", boxShadow: "0 0 0 transparent" },
          { filter: "brightness(1.5)", boxShadow: `0 0 22px ${color}` },
          { filter: "brightness(1)" },
        ],
        duration,
      );
      return;
    }
    const base = target.style.transform || "",
      color = target.classList.contains("hero-card")
        ? "#e95c55"
        : COLORS[event.element];
    await animate(
      target,
      [
        { filter: "brightness(1)", transform: `${base} translateX(0)` },
        {
          filter: `brightness(3) drop-shadow(0 0 7px ${color})`,
          transform: `${base} translateX(-3px)`,
          offset: 0.2,
        },
        {
          filter: "brightness(1.3)",
          transform: `${base} translateX(3px)`,
          offset: 0.4,
        },
        { filter: "brightness(1)", transform: `${base} translateX(0)` },
      ],
      duration,
    );
  }
  async function attack(event, onImpact = () => {}) {
    const enemy = state.enemies.find((e) => e.uid === event.source);
    if (!enemy) return heroVfx.attack(event, onImpact);
    const from = actor(event.source),
      to = actor(event.target);
    if (!from || !to) return;
    const img = from.querySelector("img");
    img.src = getEnemyAsset(enemy.assetId, "attack");
    await animate(
      from,
      [
        { filter: "brightness(1)", transform: "scale(1)" },
        { filter: "brightness(1.6)", transform: "scale(1.06)" },
        { filter: "brightness(1)", transform: "scale(1)" },
      ],
      T.enemyAttack * 0.25,
    );
    const a = center(from),
      b = center(to),
      projectile = effect(
        `projectile ${VFX_REGISTRY[event.vfx]?.shape || "bolt"}`,
        a.x,
        a.y,
        COLORS[event.element],
      );
    await animate(
      projectile,
      [
        { transform: "translate(-50%,-50%) scale(.6)", opacity: 0 },
        {
          transform: "translate(-50%,-50%) scale(1)",
          opacity: 1,
          offset: 0.15,
        },
        {
          transform: `translate(calc(-50% + ${b.x - a.x}px),calc(-50% + ${b.y - a.y}px)) scale(1.2)`,
          opacity: 1,
        },
      ],
      T.enemyAttack * 0.5,
    );
    projectile.remove();
    void particles(to, COLORS[event.element]);
    await hitStop(event.crit ? T.critStop : T.hitStop);
    await hit(to, event);
    onImpact();
    img.src = getEnemyAsset(enemy.assetId, "idle");
  }
  async function death(id) {
    const el = actor(id);
    if (!el) return;
    const enemy = state.enemies.find((e) => e.uid === id);
    void particles(
      el,
      VFX_REGISTRY[enemy?.deathVfx]?.color ||
        COLORS[enemy?.element] ||
        "#d9ccae",
    );
    await animate(
      el,
      [
        { filter: "brightness(3)", opacity: 1, transform: "scale(1)" },
        {
          filter: "grayscale(1) brightness(.4)",
          opacity: 0.7,
          transform: "scale(.97)",
          offset: 0.3,
        },
        { filter: "grayscale(1)", opacity: 0, transform: "scale(.8)" },
      ],
      enemy?.deathDuration || T.death,
    );
    el.remove();
  }
  async function swap(a, b) {
    const x = boardView.cells[a],
      y = boardView.cells[b],
      p = x.getBoundingClientRect(),
      q = y.getBoundingClientRect();
    await Promise.all([
      animate(
        x,
        [
          { transform: "translate(0,0)" },
          { transform: `translate(${q.x - p.x}px,${q.y - p.y}px)` },
        ],
        T.swap,
      ),
      animate(
        y,
        [
          { transform: "translate(0,0)" },
          { transform: `translate(${p.x - q.x}px,${p.y - q.y}px)` },
        ],
        T.swap,
      ),
    ]);
  }
  async function shake() {
    await animate(
      root.querySelector(".visual-root"),
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-3px)" },
        { transform: "translateX(3px)" },
        { transform: "translateX(0)" },
      ],
      T.clear,
    );
  }
  const ctx = {
    root,
    state,
    boardView,
    actor,
    wait,
    animate,
    center,
    effect,
    number,
    particles,
    hit,
    hitStop,
    shake,
  };
  const heroVfx = createHeroActionVfx(ctx),
    boardVfx = createBoardVfx(ctx);
  return {
    wait,
    animate,
    attack,
    hit,
    death,
    swap,
    clear: boardVfx.clear,
    fall: boardVfx.fall,
    number,
    shake,
    ultimate: heroVfx.ultimate,
    ultimateImpact: heroVfx.ultimateImpact,
  };
}
