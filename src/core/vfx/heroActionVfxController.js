import { VFX_CONFIG as T, VFX_GEOMETRY as G } from "./vfxConfig.js";
import { VFX_REGISTRY } from "./vfxRegistry.js";
import { COLORS } from "../../data/elements/index.js";
import { createUltimateView } from "../../components/hero/ultimateView.js";

export function createHeroActionVfx(ctx) {
  const {
    root,
    state,
    actor,
    center,
    effect,
    animate,
    wait,
    particles,
    hit,
    number,
    hitStop,
    shake,
  } = ctx;
  const identity = (hero) =>
    VFX_REGISTRY[hero.attackVfx] || {
      shape: "bolt",
      trail: "sparkle",
      impact: "light",
      ultimate: "celestial-pulse",
    };
  async function orbit(source, style, color, duration) {
    const p = center(source);
    await Promise.all(
      Array.from({ length: 5 }, (_, i) => {
        const node = effect(`charge-fragment ${style}`, p.x, p.y, color);
        return animate(
          node,
          [
            {
              opacity: 0,
              transform: `translate(${Math.cos(i * 1.25) * 25}px,${Math.sin(i * 1.25) * 25}px) rotate(0deg) scale(.5)`,
            },
            { opacity: 1, offset: 0.35 },
            {
              opacity: 0,
              transform: `translate(${Math.cos(i * 1.25 + 2) * 10}px,${Math.sin(i * 1.25 + 2) * 10}px) rotate(170deg) scale(1)`,
            },
          ],
          duration,
        ).then(() => node.remove());
      }),
    );
  }
  async function travel(
    source,
    target,
    style,
    color,
    duration,
    strong = false,
  ) {
    const a = center(source),
      b = center(target),
      dx = b.x - a.x,
      dy = b.y - a.y;
    const projectile = effect(
      `projectile ${style.shape}${strong ? " empowered" : ""}`,
      a.x,
      a.y,
      color,
    );
    const trails = Array.from({ length: strong ? 12 : 7 }, (_, i) =>
      (async () => {
        const fraction = (i + 1) / (strong ? 14 : 9);
        await wait(duration * fraction);
        const node = effect(
          `attack-trail ${style.trail}${strong ? " empowered" : ""}`,
          a.x + dx * fraction,
          a.y + dy * fraction,
          color,
        );
        await animate(
          node,
          [
            { opacity: 0.9, transform: "translate(-50%,-50%) scale(1)" },
            {
              opacity: 0,
              transform: `translate(${Math.sin(i * 2) * 8 - 4}px,12px) scale(.15)`,
            },
          ],
          duration * (1 - fraction),
        );
        node.remove();
      })(),
    );
    await Promise.all([
      animate(
        projectile,
        [
          { transform: "translate(-50%,-50%) scale(.5)", opacity: 0 },
          { opacity: 1, offset: 0.12 },
          {
            transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(${strong ? 1.6 : 1.1})`,
            opacity: 1,
          },
        ],
        duration,
      ),
      ...trails,
    ]);
    projectile.remove();
  }
  async function burst(target, style, color, duration, strong = false) {
    const p = center(target),
      node = effect(
        `element-impact ${style.impact}${strong ? " empowered" : ""}`,
        p.x,
        p.y,
        color,
      );
    await Promise.all([
      animate(
        node,
        [
          { opacity: 1, transform: "translate(-50%,-50%) scale(.3)" },
          {
            opacity: 0.8,
            transform: "translate(-50%,-50%) scale(1)",
            offset: 0.35,
          },
          { opacity: 0, transform: "translate(-50%,-50%) scale(1.5)" },
        ],
        duration,
      ),
      particles(target, color, false, {
        duration,
        count: strong ? 14 : 7,
        spread: strong ? 70 : 30,
        style: strong && style.impact === "dark" ? "poison" : style.trail,
      }),
    ]);
    node.remove();
  }
  async function attack(event, onImpact = () => {}) {
    const card = actor(event.source),
      target = actor(event.target);
    if (!card || !target) return;
    const hero = state.heroes.find((h) => h.id === event.source),
      style = identity(hero),
      color = COLORS[event.element],
      source = card.querySelector(".avatar-wrap") || card;
    const original = card.style.transform,
      raised = `translateY(-${G.heroRise}px) scale(${G.heroScale})`;
    card.classList.add("hero-acting");
    card.style.setProperty("--action-color", color);
    try {
      await animate(
        card,
        [
          { transform: original || "translateY(0) scale(1)" },
          { transform: raised },
        ],
        T.normalHeroRise,
      );
      card.style.transform = raised;
      await Promise.all([
        animate(
          source,
          [
            { filter: "brightness(1)" },
            { filter: "brightness(1.6)", offset: 0.65 },
            { filter: "brightness(1)" },
          ],
          T.normalHeroCharge,
        ),
        orbit(source, style.trail, color, T.normalHeroCharge),
      ]);
      await travel(source, target, style, color, T.normalHeroTravel);
      if (style.impact === "fire") await hitStop(T.hitStop);
      await Promise.all([
        hit(target, event, { number: false, duration: T.normalHeroImpact }),
        burst(target, style, color, T.normalHeroImpact),
      ]);
      onImpact();
      const floating = number(
        target,
        event.amount,
        event.kind,
        event.crit,
        T.normalNumber,
      );
      await wait(T.normalHeroFeedback);
      await Promise.all([
        animate(
          card,
          [
            { transform: raised },
            { transform: original || "translateY(0) scale(1)" },
          ],
          T.normalHeroReturn,
        ),
        floating,
      ]);
    } finally {
      card.style.transform = original;
      card.classList.remove("hero-acting");
      card.style.removeProperty("--action-color");
    }
  }
  async function ultimatePower(hero, presentation) {
    const style = identity(hero),
      color = COLORS[hero.element],
      target = actor(state.selected);
    const bounds = presentation.layer.getBoundingClientRect(),
      game = root.getBoundingClientRect();
    const p = {
      x: bounds.width * 0.4,
      y: bounds.top - game.top + bounds.height * 0.5,
    };
    const node = effect(`ultimate-power ${style.ultimate}`, p.x, p.y, color);
    const power = animate(
      node,
      [
        { opacity: 0, transform: "translate(-50%,-50%) scale(.25)" },
        {
          opacity: 1,
          transform: "translate(-50%,-50%) scale(1.1)",
          offset: 0.4,
        },
        { opacity: 0, transform: "translate(-50%,-50%) scale(1.7)" },
      ],
      T.ultimatePower,
    );
    const aura = animate(
      presentation.aura,
      [
        { opacity: 0.15, transform: "scale(.8)" },
        { opacity: 0.9, transform: "scale(1.15)", offset: 0.5 },
        { opacity: 0.25, transform: "scale(1)" },
      ],
      T.ultimatePower,
    );
    const motion =
      ["fiery-cleave", "void-bloom", "stone-wall"].includes(style.ultimate) &&
      target
        ? travel(presentation.art, target, style, color, T.ultimatePower, true)
        : orbit(presentation.art, style.trail, color, T.ultimatePower);
    await Promise.all([power, aura, motion]);
    node.remove();
    await hitStop(T.ultimateStop);
  }
  async function ultimateImpact(events, onImpact = () => {}) {
    await Promise.all(
      events.map((event) => {
        const target = actor(event.target);
        if (!target) return;
        const source = state.heroes.find((h) => h.id === event.source),
          style = identity(source);
        return Promise.all([
          hit(target, event, { number: false, duration: T.ultimateImpact }),
          event.kind === "damage"
            ? burst(
                target,
                style,
                COLORS[event.element],
                T.ultimateImpact,
                true,
              )
            : Promise.resolve(),
        ]);
      }),
    );
    onImpact();
    // All results of a single ultimate are one presentation, including ally heals/shields.
    return {
      finished: Promise.all(
        events.map((event) =>
          number(
            actor(event.target),
            event.amount,
            event.kind,
            event.crit,
            T.ultimateNumber,
          ),
        ),
      ),
    };
  }
  async function ultimate(hero, resolve) {
    const card = actor(hero.id),
      target = actor(state.selected),
      originalTargetTransform = target?.style.transform;
    let presentation;
    root.classList.add("ultimate-active");
    card?.classList.add("ultimate-caster");
    try {
      presentation = await createUltimateView(root, hero);
      presentation.layer.style.setProperty("--color", COLORS[hero.element]);
      // Keep the selected enemy opposite the left-side artwork without changing target state.
      if (target) {
        const p = center(target),
          rect = target.getBoundingClientRect();
        const x = Math.min(
          root.clientWidth * 0.8,
          root.clientWidth - rect.width / 2 - 10,
        );
        target.style.transform = `translateX(${x - p.x}px)`;
        target.classList.add("ultimate-focus");
      }
      await Promise.all([
        animate(
          presentation.art,
          [
            { opacity: 0, transform: "translateX(-35px) scale(.96)" },
            { opacity: 1, transform: "translateX(0) scale(1)" },
          ],
          T.ultimateEnter,
        ),
        animate(
          presentation.title,
          [
            { opacity: 0, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          T.ultimateEnter,
        ),
        animate(
          presentation.layer.querySelector(".ultimate-shade"),
          [{ opacity: 0 }, { opacity: 1 }],
          T.ultimateEnter,
        ),
      ]);
      await wait(T.ultimateHold);
      await ultimatePower(hero, presentation);
      // The controller calculates real results only at this impact boundary.
      // Feedback returns a completion promise; it may finish during the exit animation.
      const feedback = await resolve();
      await wait(T.ultimateFeedback);
      await Promise.all([
        animate(
          presentation.layer,
          [
            { opacity: 1, transform: "translateX(0)" },
            { opacity: 0, transform: "translateX(-22px)" },
          ],
          T.ultimateExit,
        ),
        feedback?.finished || Promise.resolve(),
      ]);
    } finally {
      presentation?.destroy();
      root.classList.remove("ultimate-active");
      card?.classList.remove("ultimate-caster");
      if (target) {
        target.style.transform = originalTargetTransform;
        target.classList.remove("ultimate-focus");
      }
    }
  }
  return { attack, ultimate, ultimateImpact };
}
