/** Shared SVG scene settings. Distances are CSS pixels and time is seconds. */
export const BACKGROUND = {
  mobileWidth: 768,
  maxCells: 110,
  mobileMaxCells: 30,
  frameRate: 30,
  mobileFrameRate: 20,
  maxDelta: 0.05,
  pointerRadius: 330,
  mobilePointerRadius: 150,
  maxTrail: 18,
  trailLife: 0.65,
  pointerMotes: 14,
  maxEchoes: 8,
  mobileMaxEchoes: 4,
  chainHits: 12,
  echoLife: 0.95,
  echoRadius: 140,
  edgeFade: 65,
  idleAfter: 3,
  maxWaves: 5,
  waveLife: 2.1,
  waveRadius: 320,
  mobileWaveRadius: 170,
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
export type Wave = Point & {
  age: number;
  power: number;
  variant: number;
  hop: number;
  chain: { hits: Set<string>; remaining: number };
};
export type Flow = Point & {
  vx: number;
  vy: number;
  energy: number;
  spin: number;
  active: boolean;
};
const createFlow = (): Flow => ({
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  energy: 0,
  spin: 0,
  active: false,
});
export type Cell = {
  column: number;
  slot: number;
  rows: number;
  width: number;
  height: number;
  layer: number;
  depth: number;
  value: CellValue | null;
  flow: Flow;
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
  echoes: Wave[];
  motes: Flow[];
  trail: (Point & { age: number })[];
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
        flow: createFlow(),
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
    echoes: [],
    motes: Array.from({ length: BACKGROUND.pointerMotes }, createFlow),
    trail: [],
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
    Object.assign(cell.flow, createFlow());
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
  const last = scene.trail.at(-1);
  if (!last || Math.hypot(last.x - point.x, last.y - point.y) > 5) {
    scene.trail.push({ ...point, age: 0 });
    if (scene.trail.length > BACKGROUND.maxTrail) scene.trail.shift();
  }
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
    hop: 0,
    chain: {
      hits: new Set(),
      remaining: scene.mobile ? 6 : BACKGROUND.chainHits,
    },
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
  const smooth = 1 - Math.exp(-dt * 18);
  p.x += (p.targetX - p.x) * smooth;
  p.y += (p.targetY - p.y) * smooth;
  p.strength +=
    ((p.inside && active ? 1 : 0) - p.strength) * (1 - Math.exp(-dt * 4));
  for (const wave of scene.waves) wave.age += dt;
  scene.waves = scene.waves.filter((wave) => wave.age < BACKGROUND.waveLife);
  for (const wave of scene.echoes) wave.age += dt;
  scene.echoes = scene.echoes.filter((wave) => wave.age < BACKGROUND.echoLife);
  for (const point of scene.trail) point.age += dt;
  scene.trail = scene.trail.filter((point) => point.age < BACKGROUND.trailLife);
  const targets: { key: string; point: Point; flow: Flow }[] = [];
  for (const cell of scene.cells) {
    const base = cellPoint(scene, cell);
    if (
      base.x < 0 ||
      base.x > scene.width ||
      base.y < 0 ||
      base.y > scene.height
    ) {
      if (cell.flow.active) Object.assign(cell.flow, createFlow());
      continue;
    }
    cell.flow.active = true;
    const target = displace(scene, base, 0.5 + cell.depth);
    spring(cell.flow, { x: target.x - base.x, y: target.y - base.y }, dt, 6);
    targets.push({
      key: `c${cell.layer}:${cell.column}:${cell.value?.row}`,
      point: { x: base.x + cell.flow.x, y: base.y + cell.flow.y },
      flow: cell.flow,
    });
  }
  scene.motes.forEach((flow, index) => {
    if (scene.mobile || p.strength < 0.01) {
      flow.active = false;
      flow.energy = 0;
      return;
    }
    const phase = index * 2.399963;
    const angle =
      phase +
      scene.travel * (0.32 + (index % 5) * 0.025) +
      Math.sin(scene.travel * 0.46 + phase) * 0.16;
    const radius =
      66 + (index % 4) * 27 + Math.sin(scene.travel * 0.63 + phase) * 16;
    const target = displace(scene, {
      x: p.x + Math.cos(angle) * radius,
      y: p.y + Math.sin(angle) * radius * 0.82,
    });
    if (!flow.active) {
      flow.x = target.x;
      flow.y = target.y;
      flow.vx = flow.vy = 0;
      flow.active = true;
    }
    spring(flow, target, dt, 5 + (index % 4));
    targets.push({ key: `m${index}`, point: flow, flow });
  });
  // Each root has a shared hit budget. Echoes can relay twice, never recursively forever.
  const limit = scene.mobile
    ? BACKGROUND.mobileMaxEchoes
    : BACKGROUND.maxEchoes;
  for (const wave of [...scene.waves, ...scene.echoes]) {
    const radius = waveRadius(scene, wave);
    for (const target of targets) {
      if (!wave.chain.remaining) break;
      // Seed a few neighbors, leaving the rest of the budget for true relays.
      if (!wave.hop && wave.chain.hits.size >= (scene.mobile ? 2 : 3)) break;
      if (wave.chain.hits.has(target.key)) continue;
      const distance = Math.hypot(
        target.point.x - wave.x,
        target.point.y - (wave.y - scene.scroll),
      );
      if (distance > radius || distance < radius - 45) continue;
      wave.chain.hits.add(target.key);
      wave.chain.remaining--;
      target.flow.energy = Math.max(
        target.flow.energy,
        Math.min(1, wave.power),
      );
      target.flow.spin += wave.power * 0.45;
      if (wave.hop < 2 && scene.echoes.length < limit) {
        scene.echoes.push({
          x: target.point.x,
          y: target.point.y + scene.scroll,
          age: 0,
          power: wave.power * 0.42,
          variant: 0,
          hop: wave.hop + 1,
          chain: wave.chain,
        });
      }
    }
  }
}

/** Exact critically damped spring; inertia without frame-rate-dependent Euler drift. */
function spring(flow: Flow, target: Point, dt: number, speed: number) {
  const decay = Math.exp(-speed * dt);
  for (const [axis, velocity] of [
    ["x", "vx"],
    ["y", "vy"],
  ] as const) {
    const offset = flow[axis] - target[axis];
    const impulse = flow[velocity] + speed * offset;
    flow[axis] = target[axis] + (offset + impulse * dt) * decay;
    flow[velocity] = (flow[velocity] - speed * impulse * dt) * decay;
  }
  flow.energy *= Math.exp(-dt * 4.5);
  flow.spin *= Math.exp(-dt * 3);
}

export function waveLife(wave: Wave) {
  return wave.hop ? BACKGROUND.echoLife : BACKGROUND.waveLife;
}
export function waveRadius(scene: BackgroundScene, wave: Wave) {
  const t = Math.min(1, wave.age / waveLife(wave));
  return (
    (wave.hop
      ? BACKGROUND.echoRadius * (scene.mobile ? 0.65 : 1)
      : scene.mobile
        ? BACKGROUND.mobileWaveRadius
        : BACKGROUND.waveRadius) *
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
  const distance = Math.hypot(dx, dy);
  const influence = falloff(distance, radius) * scene.pointer.strength * depth;
  const repel = falloff(distance, 70) * 36 * scene.pointer.strength * depth;
  const swirl =
    (0.8 + Math.sin(scene.travel * 0.55 + point.x * 0.002) * 0.2) *
    influence *
    30;
  const unit = Math.max(1, distance);
  let x =
    point.x + dx * influence * 0.42 - (dx / unit) * repel - (dy / unit) * swirl;
  let y =
    point.y + dy * influence * 0.42 - (dy / unit) * repel + (dx / unit) * swirl;
  for (const wave of [...scene.waves, ...scene.echoes]) {
    const wx = point.x - wave.x;
    const wy = point.y - (wave.y - scene.scroll);
    const distance = Math.hypot(wx, wy);
    const force =
      falloff(Math.abs(distance - waveRadius(scene, wave)), 75) *
      (1 - wave.age / waveLife(wave)) *
      52 *
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
