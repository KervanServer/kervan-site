/** Shared SVG scene settings. Distances are CSS pixels and time is seconds. */
export const BACKGROUND = {
  mobileWidth: 768,
  maxCells: 110,
  mobileMaxCells: 30,
  frameRate: 30,
  mobileFrameRate: 20,
  maxDelta: 0.05,
  pointerRadius: 200,
  mobilePointerRadius: 120,
  edgeFade: 65,
  idleAfter: 3,
  maxWaves: 5,
  waveLife: 2.1,
  waveRadius: 190,
  mobileWaveRadius: 120,
  mergeWindow: 0.2,
  mergeDistance: 45,
  sparks: 10,
  mobileSparks: 6,
  connections: 3,
  tapDistance: 9,
  tapDuration: 0.55,
  layers: [
    {
      width: 440,
      height: 320,
      mobileWidth: 250,
      mobileHeight: 350,
      depth: 0.18,
    },
    {
      width: 640,
      height: 460,
      mobileWidth: 380,
      mobileHeight: 480,
      depth: 0.34,
    },
  ],
} as const;

export type Point = { x: number; y: number };
export type Box = Point & { width: number; height: number };
export type Wave = Point & { age: number; power: number; variant: number };
export type Cell = {
  column: number;
  slot: number;
  rows: number;
  width: number;
  height: number;
  layer: number;
  depth: number;
  value: CellValue | null;
};
type CellValue = Point & {
  row: number;
  phase: number;
  size: number;
  kind: number;
  speed: number;
  direction: number;
};
export type BackgroundScene = {
  width: number;
  height: number;
  mobile: boolean;
  scroll: number;
  time: number;
  travel: number;
  activity: number;
  lastInput: number;
  cells: Cell[];
  waves: Wave[];
  pointer: Point & {
    targetX: number;
    targetY: number;
    inside: boolean;
    strength: number;
  };
};

export function falloff(distance: number, radius: number) {
  const t = Math.max(0, 1 - distance / radius);
  return t * t * (3 - 2 * t);
}
export function isTap(
  start: Point & { time: number },
  end: Point & { time: number },
) {
  return (
    end.time - start.time <= BACKGROUND.tapDuration &&
    Math.hypot(end.x - start.x, end.y - start.y) <= BACKGROUND.tapDistance
  );
}
export function createBackground(
  width: number,
  height: number,
): BackgroundScene {
  const mobile = width < BACKGROUND.mobileWidth;
  const budget = mobile ? BACKGROUND.mobileMaxCells : BACKGROUND.maxCells;
  let scale = Math.max(1, Math.sqrt((width * height) / (1920 * 1080)));
  let cells: Cell[];
  do {
    cells = BACKGROUND.layers.flatMap((layer, layerIndex) => {
      const columns = Math.max(
        1,
        Math.ceil(width / ((mobile ? layer.mobileWidth : layer.width) * scale)),
      );
      const cellHeight = (mobile ? layer.mobileHeight : layer.height) * scale;
      const rows = Math.ceil(height / cellHeight) + 3;
      return Array.from({ length: columns * rows }, (_, index) => ({
        column: index % columns,
        slot: Math.floor(index / columns),
        rows,
        width: width / columns,
        height: cellHeight,
        layer: layerIndex,
        depth: layer.depth,
        value: null,
      }));
    });
    scale *= 1.1;
  } while (cells.length > budget);
  return {
    width,
    height,
    mobile,
    scroll: 0,
    time: 0,
    travel: 0,
    activity: 0.35,
    lastInput: -10,
    cells,
    waves: [],
    pointer: { x: 0, y: 0, targetX: 0, targetY: 0, inside: false, strength: 0 },
  };
}

/** Recycle only a row that has left the viewport. Visible cells keep their identity. */
export function cellPoint(
  scene: BackgroundScene,
  cell: Cell,
  reduced = false,
): Point {
  const camera = reduced ? 0 : scene.scroll * cell.depth;
  const first = Math.floor(camera / cell.height) - 1;
  const row =
    first + ((((cell.slot - first) % cell.rows) + cell.rows) % cell.rows);
  if (cell.value?.row !== row) {
    let seed =
      (row * 92821 + cell.column * 68917 + cell.layer * 31337 + 817) >>> 0;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    cell.value = {
      row,
      // Stratified columns keep tablet and ultrawide edges evenly populated.
      x: (cell.column + 0.44 + random() * 0.12) * cell.width,
      y: (row + 0.16 + random() * 0.68) * cell.height,
      phase: random() * Math.PI * 2,
      size: 8 + random() * 10,
      kind: Math.floor(random() * 4),
      speed: 0.025 + random() * 0.025,
      direction: random() > 0.5 ? 1 : -1,
    };
  }
  const { value } = cell;
  const time = reduced ? 0 : scene.travel;
  return {
    x: value.x + Math.sin(time * 0.2 + value.phase) * (5 + cell.depth * 20),
    y:
      value.y -
      camera +
      Math.cos(time * 0.16 + value.phase) * (7 + cell.depth * 22),
  };
}

export function movePointer(scene: BackgroundScene, point: Point) {
  const p = scene.pointer;
  if (!p.inside && p.strength < 0.01) {
    p.x = point.x;
    p.y = point.y;
  }
  p.targetX = point.x;
  p.targetY = point.y;
  p.inside = true;
  scene.lastInput = scene.time;
}
export function emitWave(scene: BackgroundScene, point: Point) {
  scene.lastInput = scene.time;
  const world = { x: point.x, y: point.y + scene.scroll };
  const recent = scene.waves.find(
    (wave) =>
      wave.age < BACKGROUND.mergeWindow &&
      Math.hypot(wave.x - world.x, wave.y - world.y) < BACKGROUND.mergeDistance,
  );
  if (recent) {
    recent.power = Math.min(1.35, recent.power + 0.08);
    return false;
  }
  if (scene.waves.length >= BACKGROUND.maxWaves) return false;
  scene.waves.push({
    ...world,
    age: 0,
    power: 1,
    variant: Math.floor(point.x / 170 + point.y / 130 + scene.time * 2) % 3,
  });
  return true;
}
export function stepBackground(scene: BackgroundScene, elapsed: number) {
  const dt = Math.min(BACKGROUND.maxDelta, Math.max(0, elapsed));
  scene.time += dt;
  const active = scene.time - scene.lastInput < BACKGROUND.idleAfter;
  scene.activity +=
    ((active ? 1 : 0.18) - scene.activity) * (1 - Math.exp(-dt * 2));
  scene.travel += dt * (0.4 + scene.activity * 0.6);
  const p = scene.pointer;
  const smooth = 1 - Math.exp(-dt * 9);
  p.x += (p.targetX - p.x) * smooth;
  p.y += (p.targetY - p.y) * smooth;
  p.strength +=
    ((p.inside && active ? 1 : 0) - p.strength) * (1 - Math.exp(-dt * 4));
  for (const wave of scene.waves) wave.age += dt;
  scene.waves = scene.waves.filter((wave) => wave.age < BACKGROUND.waveLife);
}
export function waveRadius(scene: BackgroundScene, wave: Wave) {
  const t = Math.min(1, wave.age / BACKGROUND.waveLife);
  return (
    (scene.mobile ? BACKGROUND.mobileWaveRadius : BACKGROUND.waveRadius) *
    (1 - (1 - t) ** 3)
  );
}
export function displace(
  scene: BackgroundScene,
  point: Point,
  depth = 1,
): Point {
  const radius = scene.mobile
    ? BACKGROUND.mobilePointerRadius
    : BACKGROUND.pointerRadius;
  const dx = scene.pointer.x - point.x;
  const dy = scene.pointer.y - point.y;
  const pull =
    falloff(Math.hypot(dx, dy), radius) * scene.pointer.strength * depth * 0.2;
  let x = point.x + dx * pull;
  let y = point.y + dy * pull;
  for (const wave of scene.waves) {
    const wx = point.x - wave.x;
    const wy = point.y - (wave.y - scene.scroll);
    const distance = Math.hypot(wx, wy);
    const force =
      falloff(Math.abs(distance - waveRadius(scene, wave)), 40) *
      (1 - wave.age / BACKGROUND.waveLife) *
      12 *
      wave.power *
      depth;
    if (distance > 0) {
      x += (wx / distance) * force;
      y += (wy / distance) * force;
    }
  }
  return { x, y };
}
export function edgeOpacity(scene: BackgroundScene, point: Point) {
  return (
    1 -
    falloff(
      Math.max(
        0,
        Math.min(
          point.x,
          scene.width - point.x,
          point.y,
          scene.height - point.y,
        ),
      ),
      BACKGROUND.edgeFade,
    )
  );
}
export function inBox(point: Point, box: Box) {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}
export function packetPoint(progress: number): Point {
  const x = (((progress % 1) + 1) % 1) * 192 - 96;
  return {
    x,
    y: x < -46 ? 24 : x < -22 ? -x - 22 : x < 24 ? 0 : x < 48 ? 24 - x : -24,
  };
}
