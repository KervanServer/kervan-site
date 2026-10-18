import { expect, test } from "@playwright/test";
import {
  BACKGROUND,
  cellPoint,
  createBackground,
  displace,
  edgeOpacity,
  emitWave,
  isTap,
  movePointer,
  stepBackground,
  waveRadius,
} from "../src/lib/background-scene";

test("mobile and 4K fields keep bounded density and cover both sides of the viewport", () => {
  const mobile = createBackground(375, 812);
  expect(mobile.cells.length).toBeLessThanOrEqual(BACKGROUND.mobileMaxCells);
  for (const width of [768, 1440, 1920, 3840]) {
    const scene = createBackground(width, 1080);
    expect(scene.cells.length).toBeLessThanOrEqual(BACKGROUND.maxCells);
    expect(scene.cells.length).toBeGreaterThan(mobile.cells.length);
    for (const scroll of [0, 1200, 9000, 25000]) {
      scene.scroll = scroll;
      const visible = scene.cells
        .map((cell) => cellPoint(scene, cell))
        .filter((point) => point.y > 65 && point.y < scene.height - 65);
      expect(visible.some((point) => point.x < width * 0.3)).toBe(true);
      expect(
        visible.some((point) => point.x > width * 0.7),
        JSON.stringify({ width, scroll, visible }),
      ).toBe(true);
    }
  }
});

test("crossing a tile boundary preserves visible objects and advances each depth smoothly", () => {
  const scene = createBackground(1920, 1080);
  scene.scroll = 1777;
  const before = scene.cells.map((cell) => ({
    point: cellPoint(scene, cell),
    row: cell.value?.row,
    cell,
  }));
  scene.scroll += 2;
  let checked = 0;
  for (const previous of before) {
    const after = cellPoint(scene, previous.cell);
    if (previous.point.y < 70 || previous.point.y > scene.height - 70) continue;
    expect(previous.cell.value?.row).toBe(previous.row);
    expect(after.x).toBeCloseTo(previous.point.x, 5);
    expect(previous.point.y - after.y).toBeCloseTo(2 * previous.cell.depth, 5);
    checked++;
  }
  expect(checked).toBeGreaterThan(10);
  const cell = scene.cells[0];
  const reduced = cellPoint(scene, cell, true);
  scene.scroll += 10_000;
  expect(cellPoint(scene, cell, true)).toEqual(reduced);
});

test("rapid waves merge, stay local, have a hard cap, and expire completely", () => {
  const scene = createBackground(1920, 1080);
  scene.scroll = 3000;
  emitWave(scene, { x: 500, y: 400 });
  for (let i = 0; i < 200; i++) emitWave(scene, { x: 505, y: 405 });
  expect(scene.waves).toHaveLength(1);
  expect(scene.waves[0].y).toBe(3400);
  expect(scene.waves[0].power).toBeLessThanOrEqual(1.35);
  for (let i = 0; i < 200; i++) emitWave(scene, { x: i * 60, y: 500 });
  expect(scene.waves).toHaveLength(BACKGROUND.maxWaves);
  for (let i = 0; i < 150; i++) {
    stepBackground(scene, 1 / 60);
    for (const wave of scene.waves)
      expect(waveRadius(scene, wave)).toBeLessThanOrEqual(
        BACKGROUND.waveRadius,
      );
    expect(displace(scene, { x: 1800, y: 1000 })).toEqual({ x: 1800, y: 1000 });
  }
  expect(scene.waves).toHaveLength(0);
});

test("pointer influence is local, fades on leave, and resumes from idle", () => {
  const scene = createBackground(1440, 900);
  movePointer(scene, { x: 600, y: 400 });
  for (let i = 0; i < 60; i++) stepBackground(scene, 1 / 60);
  expect(displace(scene, { x: 650, y: 430 }).x).toBeLessThan(650);
  expect(displace(scene, { x: 1100, y: 700 })).toEqual({ x: 1100, y: 700 });
  const before = scene.pointer.strength;
  scene.pointer.inside = false;
  stepBackground(scene, 1 / 60);
  expect(scene.pointer.strength).toBeLessThan(before);
  expect(scene.pointer.strength).toBeGreaterThan(before * 0.9);
  for (let i = 0; i < 360; i++) stepBackground(scene, 1 / 60);
  expect(scene.pointer.strength).toBeLessThan(0.001);
  expect(scene.activity).toBeLessThan(0.2);
  movePointer(scene, { x: 600, y: 400 });
  for (let i = 0; i < 60; i++) stepBackground(scene, 1 / 60);
  expect(scene.activity).toBeGreaterThan(0.85);
  expect(edgeOpacity(scene, { x: 0, y: 300 })).toBe(0);
  expect(edgeOpacity(scene, { x: 20, y: 300 })).toBeGreaterThan(0);
});

test("movement is refresh-rate independent, elapsed jumps are bounded, taps exclude swipes", () => {
  const a = createBackground(1920, 1080);
  const b = createBackground(1920, 1080);
  for (let i = 0; i < 600; i++) stepBackground(a, 1 / 60);
  for (let i = 0; i < 1200; i++) stepBackground(b, 1 / 120);
  expect(a.time).toBeCloseTo(b.time, 5);
  expect(a.travel).toBeCloseTo(b.travel, 2);
  const before = a.time;
  stepBackground(a, 30);
  expect(a.time - before).toBeCloseTo(BACKGROUND.maxDelta, 5);
  const start = { x: 100, y: 100, time: 1 };
  expect(isTap(start, { x: 104, y: 103, time: 1.2 })).toBe(true);
  expect(isTap(start, { x: 100, y: 100, time: 2 })).toBe(false);
  expect(isTap(start, { x: 100, y: 140, time: 1.2 })).toBe(false);
});
