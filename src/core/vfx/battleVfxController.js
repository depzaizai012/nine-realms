import { VFX_CONFIG as T } from "./vfxConfig.js";
import { VFX_REGISTRY } from "./vfxRegistry.js";
import { COLORS } from "../../data/elements/index.js";
import { getEnemyAsset } from "../../data/assets/manifest.js";
export function createVfx(root, state, boardView) {
  const layer = root.querySelector(".vfx-layer"),
    actor = (id) => root.querySelector(`[data-actor="${id}"]`);
  const wait = async (ms) => {
    let remaining = ms;
    while (remaining > 0) {
      await new Promise((r) => setTimeout(r, Math.min(remaining, 25)));
      if (!state.paused) remaining -= 25 * state.speed;
    }
  };
  const animate = async (el, frames, ms) => {
    if (!el) return;
    const a = el.animate(frames, {
      duration: ms / state.speed,
      easing: "ease-in-out",
      fill: "none",
    });
    const interval = setInterval(
      () =>
        state.paused || root.classList.contains("hit-stop")
          ? a.pause()
          : a.play(),
      25,
    );
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
  const center = (el) => {
    const r = el.getBoundingClientRect(),
      p = root.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - p.left,
      y: r.top + r.height / 2 - p.top,
    };
  };
  function effect(cls, x, y, color) {
    const el = document.createElement("i");
    el.className = cls;
    Object.assign(el.style, {
      left: `${x}px`,
      top: `${y}px`,
      "--color": color,
    });
    layer.append(el);
    return el;
  }
  async function number(target, amount, kind = "damage", crit = false) {
    if (!target) return;
    const p = center(target),
      el = effect(
        `floating-number ${kind}`,
        p.x,
        p.y,
        kind === "damage" ? "#fff0d5" : "#a0ffc8",
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
      T.number,
    );
    el.remove();
  }
  async function particles(el, color, heal = false) {
    const p = center(el),
      items = Array.from({ length: heal ? 5 : 8 }, (_, i) => {
        const node = effect(
          heal ? "heal-particle" : "particle",
          p.x,
          p.y,
          color,
        );
        if (heal) node.textContent = "+";
        return animate(
          node,
          [
            { opacity: 1, transform: "translate(0,0) scale(1)" },
            {
              opacity: 0,
              transform: `translate(${Math.cos(i * 2.4) * 32}px,${Math.sin(i * 2.4) * 25 - 20}px) scale(.2)`,
            },
          ],
          T.number,
        ).then(() => node.remove());
      });
    await Promise.all(items);
  }
  async function hit(target, event) {
    if (!target) return;
    void number(target, event.amount, event.kind, event.crit);
    if (event.kind === "heal" || event.kind === "shield") {
      void particles(
        target,
        event.element === "LIGHT" ? "#ffe5a2" : "#9affbe",
        true,
      );
      await animate(
        target,
        [
          { filter: "brightness(1)", boxShadow: "0 0 0 transparent" },
          { filter: "brightness(1.5)", boxShadow: "0 0 22px #7dffba" },
          { filter: "brightness(1)" },
        ],
        T.heroAttack,
      );
      return;
    }
    await animate(
      target,
      [
        { filter: "brightness(1)", transform: "translateX(0)" },
        {
          filter: "brightness(3) drop-shadow(0 0 7px #e95c55)",
          transform: "translateX(-3px)",
          offset: 0.2,
        },
        {
          filter: "brightness(1.3)",
          transform: "translateX(3px)",
          offset: 0.4,
        },
        { filter: "brightness(1)", transform: "translateX(0)" },
      ],
      T.heroAttack,
    );
  }
  async function attack(event) {
    const from = actor(event.source),
      to = actor(event.target);
    if (!from || !to) return;
    const enemy = state.enemies.find((e) => e.uid === event.source),
      duration = enemy ? T.enemyAttack : T.heroAttack;
    const img = enemy && from.querySelector("img");
    if (img) img.src = getEnemyAsset(enemy.assetId, "attack");
    await animate(
      from,
      [
        { filter: "brightness(1)", transform: "scale(1)" },
        { filter: "brightness(1.6)", transform: "scale(1.06)" },
        { filter: "brightness(1)", transform: "scale(1)" },
      ],
      duration * 0.25,
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
          transform: `translate(${b.x - a.x}px,${b.y - a.y}px) scale(1.2)`,
          opacity: 1,
        },
      ],
      duration * 0.5,
    );
    projectile.remove();
    void particles(to, COLORS[event.element]);
    await hitStop(event.crit ? T.critStop : T.hitStop);
    if (event.crit) await shake();
    await hit(to, event);
    if (img) img.src = getEnemyAsset(enemy.assetId, "idle");
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
  async function special(activation, clear) {
    const cell = boardView.cells[activation.index],
      p = center(cell),
      type = activation.type,
      color = COLORS[activation.element] || "#e5b8ff";
    await animate(
      cell,
      [
        { filter: "brightness(1)", transform: "scale(1)" },
        { filter: "brightness(3)", transform: "scale(1.2)" },
        { filter: "brightness(1)", transform: "scale(1)" },
      ],
      T.clear,
    );
    if (type.startsWith("LINE")) {
      const beam = effect(
        `beam ${type === "LINE_HORIZONTAL" ? "horizontal" : "vertical"}`,
        p.x,
        p.y,
        color,
      );
      await animate(
        beam,
        [
          { opacity: 0, transform: "translate(-50%,-50%) scale(.1)" },
          {
            opacity: 1,
            transform: "translate(-50%,-50%) scale(1)",
            offset: 0.35,
          },
          { opacity: 0, transform: "translate(-50%,-50%) scale(1.1)" },
        ],
        T.line,
      );
      beam.remove();
    } else if (type === "BOMB") {
      const ring = effect("explosion", p.x, p.y, "#ffd37c");
      void shake();
      await hitStop(T.bombStop);
      await animate(
        ring,
        [
          { opacity: 1, transform: "translate(-50%,-50%) scale(.1)" },
          { opacity: 0, transform: "translate(-50%,-50%) scale(2)" },
        ],
        T.bomb,
      );
      ring.remove();
    } else {
      const rays = clear.map((i) => {
        const q = center(boardView.cells[i]),
          ray = effect("prism-ray", p.x, p.y, "#eed6ff");
        ray.style.width = `${Math.hypot(q.x - p.x, q.y - p.y)}px`;
        ray.style.transform = `rotate(${Math.atan2(q.y - p.y, q.x - p.x)}rad)`;
        return ray;
      });
      await animate(
        cell,
        [
          { filter: "hue-rotate(0deg) brightness(2)" },
          { filter: "hue-rotate(360deg) brightness(3)" },
        ],
        T.prism,
      );
      rays.forEach((el) => el.remove());
    }
    void particles(cell, color);
  }
  async function clear(step) {
    for (const a of step.activations) await special(a, step.clear);
    await Promise.all(
      step.clear.map((i) =>
        animate(
          boardView.cells[i],
          [
            { filter: "brightness(1)", transform: "scale(1)", opacity: 1 },
            {
              filter: "brightness(3)",
              transform: "scale(1.12)",
              opacity: 1,
              offset: 0.3,
            },
            { filter: "brightness(1)", transform: "scale(.1)", opacity: 0 },
          ],
          T.clear,
        ),
      ),
    );
  }
  async function fall() {
    await Promise.all(
      boardView.cells.map((el) =>
        animate(
          el,
          [
            { transform: "translateY(-16px)", opacity: 0.3 },
            { transform: "translateY(0)", opacity: 1 },
          ],
          T.fall,
        ),
      ),
    );
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
  return {
    wait,
    animate,
    attack,
    hit,
    death,
    swap,
    clear,
    fall,
    number,
    shake,
  };
}
