"use client";

import { useEffect, useRef } from "react";
import { drawHeroScene } from "@/lib/draw-hero-scene";
import {
  createScene,
  emitWave,
  HERO_SCENE,
  isTap,
  movePointer,
  type Point,
  renderScale,
  stepScene,
} from "@/lib/hero-scene";

const protectedContent =
  "a,button,input,select,textarea,summary,[role='button'],[role='tab'],[contenteditable],h1,h2,h3,p,pre,code,.hero-trust,figcaption";

/** Parent supplies the scene's bounds. The canvas never intercepts input. */
export function HeroBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = ref.current;
    const parent = element?.parentElement;
    const context = element?.getContext("2d", { alpha: true });
    if (!element || !parent || !context) return;
    const canvas = element;
    const stage = parent;
    const ctx = context;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    let scene = createScene(1, 1);
    let dark = false;
    let visible = false;
    let disposed = false;
    let raf = 0;
    let previous = 0;
    let drawn = 0;
    let pixelRatio = window.devicePixelRatio;
    let press: (Point & { time: number; id: number; moved: boolean }) | null =
      null;
    const localPoint = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const protectedTarget = (event: PointerEvent) =>
      event.target instanceof Element &&
      !!event.target.closest(protectedContent);
    const paint = () => drawHeroScene(ctx, scene, dark, motion.matches);
    const readTheme = () => {
      const theme = document.documentElement.dataset.theme;
      dark = theme === "dark" || (theme !== "light" && scheme.matches);
      if (motion.matches || !raf) paint();
    };
    function resize() {
      if (disposed) return;
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      // Resizing only rebuilds geometry when the CSS bounds change.
      if (width !== scene.width || height !== scene.height) {
        const next = createScene(width, height);
        next.time = scene.time;
        next.travel = scene.travel;
        next.activity = scene.activity;
        scene = next;
        press = null;
      }
      pixelRatio = window.devicePixelRatio;
      const scale = renderScale(width, height, pixelRatio);
      canvas.width = Math.max(1, Math.floor(width * scale));
      canvas.height = Math.max(1, Math.floor(height * scale));
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const bounds = stage.getBoundingClientRect();
      scene.quiet = Array.from(
        stage.querySelectorAll(".hero-copy > *, .hero-scroll"),
      ).map((element) => {
        const box = element.getBoundingClientRect();
        return {
          x: box.left - bounds.left - 8,
          y: box.top - bounds.top - 8,
          width: box.width + 16,
          height: box.height + 16,
        };
      });
      paint();
    }
    function frame(timestamp: number) {
      raf = 0;
      if (disposed || !visible || document.hidden || motion.matches) return;
      if (window.devicePixelRatio !== pixelRatio) resize();
      const dt = previous ? (timestamp - previous) / 1000 : 0;
      previous = timestamp;
      stepScene(scene, dt);
      if (
        timestamp - drawn >=
        (scene.activity > 0.22 ? 1000 / 60 : 1000 / 30)
      ) {
        paint();
        drawn = timestamp;
      }
      raf = requestAnimationFrame(frame);
    }
    function synchronize() {
      cancelAnimationFrame(raf);
      raf = 0;
      previous = 0;
      drawn = 0;
      press = null;
      const running = visible && !document.hidden && !motion.matches;
      canvas.dataset.motion = motion.matches
        ? "reduced"
        : running
          ? "running"
          : "paused";
      if (running) raf = requestAnimationFrame(frame);
      else {
        scene.waves = [];
        scene.trail = [];
        scene.pointer.inside = false;
        scene.pointer.strength = 0;
        if (motion.matches) paint();
      }
    }
    function move(event: PointerEvent) {
      const point = localPoint(event);
      if (
        press &&
        (event.pointerId !== press.id ||
          Math.hypot(point.x - press.x, point.y - press.y) >
            HERO_SCENE.tapDistance)
      )
        press.moved = true;
      if (motion.matches || event.pointerType === "touch") return;
      if (protectedTarget(event)) {
        scene.pointer.inside = false;
        return;
      }
      movePointer(scene, point);
    }
    function down(event: PointerEvent) {
      if (
        motion.matches ||
        !event.isPrimary ||
        event.button !== 0 ||
        protectedTarget(event)
      )
        return;
      press = {
        ...localPoint(event),
        time: performance.now() / 1000,
        id: event.pointerId,
        moved: false,
      };
    }
    function up(event: PointerEvent) {
      const start = press;
      press = null;
      if (
        !start ||
        start.moved ||
        event.pointerId !== start.id ||
        protectedTarget(event) ||
        !window.getSelection()?.isCollapsed
      )
        return;
      const end = { ...localPoint(event), time: performance.now() / 1000 };
      if (isTap(start, end)) emitWave(scene, end);
    }
    function leave() {
      scene.pointer.inside = false;
      press = null;
    }
    function cancel() {
      press = null;
    }
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      synchronize();
    });
    const sizing = new ResizeObserver(resize);
    const themeObserver = new MutationObserver(readTheme);
    readTheme();
    resize();
    synchronize();
    observer.observe(stage);
    sizing.observe(stage);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    document.fonts.ready.then(() => {
      if (!disposed) resize();
    });
    document.addEventListener("visibilitychange", synchronize);
    window.addEventListener("resize", resize, { passive: true });
    motion.addEventListener("change", synchronize);
    scheme.addEventListener("change", readTheme);
    stage.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerdown", down, { passive: true });
    stage.addEventListener("pointerup", up, { passive: true });
    stage.addEventListener("pointerleave", leave, { passive: true });
    stage.addEventListener("pointercancel", cancel, { passive: true });
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      sizing.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", synchronize);
      scheme.removeEventListener("change", readTheme);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointerleave", leave);
      stage.removeEventListener("pointercancel", cancel);
    };
  }, []);
  return (
    <canvas
      className="hero-backdrop"
      ref={ref}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
