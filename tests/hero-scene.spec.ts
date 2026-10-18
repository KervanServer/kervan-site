import { expect, test } from "@playwright/test";
import {
  createScene,
  displace,
  emitWave,
  falloff,
  HERO_SCENE,
  isTap,
  movePointer,
  pointOnRoute,
  renderScale,
  stepScene,
  visibilityAt,
  waveRadius,
} from "../src/lib/hero-scene";

test("rapid clicks merge locally, stay bounded, and completely expire", () => {
  const scene = createScene(1920, 960);
  expect(emitWave(scene, { x: 500, y: 400 })).toBe(true);
  for (let i = 0; i < 200; i++) emitWave(scene, { x: 505, y: 405 });
  expect(scene.waves).toHaveLength(1);
  expect(scene.waves[0].power).toBeLessThanOrEqual(1.4);
  for (let i = 0; i < 200; i++)
    emitWave(scene, { x: (i % 10) * 180, y: Math.floor(i / 10) * 100 });
  expect(scene.waves).toHaveLength(HERO_SCENE.maxWaves);
  for (let i = 0; i < 120; i++) {
    stepScene(scene, 1 / 60);
    for (const wave of scene.waves)
      expect(waveRadius(scene, wave)).toBeLessThanOrEqual(
        HERO_SCENE.waveRadius,
      );
  }
  expect(scene.waves).toHaveLength(0);
});

test("pointer force is local, leaves smoothly, and reactivates after idle", () => {
  const scene = createScene(1440, 900);
  movePointer(scene, { x: 600, y: 400 });
  for (let i = 0; i < 60; i++) stepScene(scene, 1 / 60);
  const near = { x: 650, y: 430 };
  const far = { x: 1100, y: 700 };
  expect(displace(scene, near).x).toBeLessThan(near.x);
  expect(displace(scene, far)).toEqual(far);
  const before = scene.pointer.strength;
  scene.pointer.inside = false;
  stepScene(scene, 1 / 60);
  expect(scene.pointer.strength).toBeLessThan(before);
  expect(scene.pointer.strength).toBeGreaterThan(before * 0.9);
  for (let i = 0; i < 360; i++) stepScene(scene, 1 / 60);
  expect(scene.pointer.strength).toBeLessThan(0.001);
  expect(scene.activity).toBeLessThan(0.18);
  expect(scene.trail).toHaveLength(0);
  movePointer(scene, near);
  for (let i = 0; i < 60; i++) stepScene(scene, 1 / 60);
  expect(scene.activity).toBeGreaterThan(0.85);
  expect(falloff(HERO_SCENE.pointerRadius, HERO_SCENE.pointerRadius)).toBe(0);
});

test("60Hz and 120Hz cover the same distance; suspension cannot advance a large time jump", () => {
  const a = createScene(1920, 960);
  const b = createScene(1920, 960);
  for (let i = 0; i < 600; i++) stepScene(a, 1 / 60);
  for (let i = 0; i < 1200; i++) stepScene(b, 1 / 120);
  expect(a.time).toBeCloseTo(b.time, 5);
  const position = (scene: typeof a) =>
    pointOnRoute(scene.routes[0], (scene.travel * 40) / scene.routes[0].length);
  expect(
    Math.hypot(position(a).x - position(b).x, position(a).y - position(b).y),
  ).toBeLessThan(0.1);
  const time = a.time;
  stepScene(a, 60);
  expect(a.time - time).toBeCloseTo(HERO_SCENE.maxFrameDelta, 5);
});

test("mobile and 4K budgets, quiet zones and soft edges preserve the composition", () => {
  const mobile = createScene(375, 1000);
  const desktop = createScene(1920, 960);
  const wide = createScene(3840, 960);
  expect(mobile.packets.length).toBeLessThan(desktop.packets.length);
  expect(mobile.gates.length).toBeLessThan(desktop.gates.length);
  expect(wide.packets.length).toBeLessThanOrEqual(100);
  expect(wide.gates.some((gate) => gate.x > 3400)).toBe(true);
  expect(wide.gates.some((gate) => gate.x < 300)).toBe(true);
  expect(wide.gates.some((gate) => gate.y > wide.height * 0.85)).toBe(true);
  const scale = renderScale(3840, 2160, 3);
  expect(
    Math.floor(3840 * scale) * Math.floor(2160 * scale),
  ).toBeLessThanOrEqual(HERO_SCENE.maxPixels);
  expect(renderScale(375, 1000, 3)).toBe(HERO_SCENE.maxDpr);
  desktop.quiet.push({ x: 100, y: 100, width: 500, height: 400 });
  expect(visibilityAt(desktop, { x: 300, y: 300 })).toBeCloseTo(0.1);
  expect(visibilityAt(desktop, { x: 900, y: 300 })).toBe(1);
  expect(visibilityAt(desktop, { x: 0, y: 300 })).toBe(0);
  expect(visibilityAt(desktop, { x: 20, y: 300 })).toBeGreaterThan(0);
  expect(visibilityAt(desktop, { x: 20, y: 300 })).toBeLessThan(0.3);
});

test("taps exclude long presses and swipes", () => {
  const start = { x: 100, y: 100, time: 1 };
  expect(isTap(start, { x: 103, y: 102, time: 1.2 })).toBe(true);
  expect(isTap(start, { x: 100, y: 100, time: 2 })).toBe(false);
  expect(isTap(start, { x: 100, y: 130, time: 1.2 })).toBe(false);
});
