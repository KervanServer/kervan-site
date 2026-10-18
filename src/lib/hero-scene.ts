/** All distances are CSS pixels; all times are seconds. No React state per frame. */
export const HERO_SCENE = {
  mobileWidth: 768,
  maxDpr: 1.75,
  maxPixels: 4_000_000,
  maxFrameDelta: 0.05,
  intro: 1.4,
  idleAfter: 3,
  edgeFade: 64,
  pointerRadius: 190,
  mobilePointerRadius: 115,
  maxWaves: 6,
  waveLife: 1.65,
  waveRadius: 210,
  mobileWaveRadius: 125,
  mergeWindow: 0.18,
  mergeDistance: 42,
  trailLife: 0.65,
  maxTrail: 12,
  tapDistance: 9,
  tapDuration: 0.55,
  density: {
    mobile: {
      routes: 6,
      packets: 22,
      maxGates: 14,
      gateSpacing: 170,
      sparks: 7,
    },
    desktop: {
      maxRoutes: 16,
      minRoutes: 8,
      routeSpacing: 85,
      minPackets: 38,
      maxPackets: 100,
      packetArea: 18000,
      maxGates: 64,
      gateSpacing: 230,
      sparks: 12,
    },
  },
  packetSpeed: { min: 15, range: 32 },
  palettes: {
    light: {
      gold: "#987020",
      wire: [173, 150, 98],
      route: 0.16,
      node: 0.38,
      packet: 0.62,
      effect: 0.65,
    },
    dark: {
      gold: "#dfb85f",
      wire: [146, 128, 98],
      route: 0.13,
      node: 0.34,
      packet: 0.61,
      effect: 0.68,
    },
  },
} as const;

export type Point = { x: number; y: number };
export type QuietZone = { x: number; y: number; width: number; height: number };
export type Wave = Point & { age: number; variant: number; power: number };
type Route = { points: Point[]; length: number; depth: number };
type Packet = {
  route: number;
  progress: number;
  speed: number;
  size: number;
  direction: number;
};
type Gate = Point & {
  size: number;
  phase: number;
  depth: number;
  bridge: boolean;
};
export type Scene = {
  width: number;
  height: number;
  mobile: boolean;
  time: number;
  travel: number;
  activity: number;
  lastInput: number;
  pointer: Point & {
    targetX: number;
    targetY: number;
    inside: boolean;
    strength: number;
  };
  routes: Route[];
  packets: Packet[];
  gates: Gate[];
  waves: Wave[];
  trail: (Point & { age: number })[];
  quiet: QuietZone[];
};

export function renderScale(width: number, height: number, dpr: number) {
  return Math.min(
    dpr,
    HERO_SCENE.maxDpr,
    Math.sqrt(HERO_SCENE.maxPixels / Math.max(1, width * height)),
  );
}
export function falloff(distance: number, radius: number) {
  const t = Math.max(0, 1 - distance / radius);
  return t * t * (3 - 2 * t);
}
export function isTap(
  start: Point & { time: number },
  end: Point & { time: number },
) {
  return (
    end.time - start.time <= HERO_SCENE.tapDuration &&
    Math.hypot(end.x - start.x, end.y - start.y) <= HERO_SCENE.tapDistance
  );
}
export function createScene(width: number, height: number): Scene {
  let seed = 817;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const mobile = width < HERO_SCENE.mobileWidth;
  const density = HERO_SCENE.density;
  const routeCount = mobile
    ? density.mobile.routes
    : Math.min(
        density.desktop.maxRoutes,
        Math.max(
          density.desktop.minRoutes,
          Math.ceil(height / density.desktop.routeSpacing),
        ),
      );
  const routes: Route[] = Array.from({ length: routeCount }, (_, i) => {
    const y = ((i + 0.5) / routeCount) * height;
    const bend = (random() - 0.5) * Math.min(height * 0.3, 180);
    const points = [
      { x: -60, y },
      { x: width * (0.12 + random() * 0.1), y },
      { x: width * 0.35, y: y + bend },
      { x: width * 0.63, y: y + bend },
      { x: width * (0.8 + random() * 0.08), y },
      { x: width + 60, y },
    ];
    return {
      points,
      length: points
        .slice(1)
        .reduce(
          (length, p, index) =>
            length + Math.hypot(p.x - points[index].x, p.y - points[index].y),
          0,
        ),
      depth: 0.4 + random() * 0.6,
    };
  });
  const packetCount = mobile
    ? density.mobile.packets
    : Math.min(
        density.desktop.maxPackets,
        Math.max(
          density.desktop.minPackets,
          Math.ceil((width * height) / density.desktop.packetArea),
        ),
      );
  const packets = Array.from({ length: packetCount }, (_, i) => ({
    route: i % routeCount,
    progress: random(),
    speed: HERO_SCENE.packetSpeed.min + random() * HERO_SCENE.packetSpeed.range,
    size: 1.6 + random() * 1.8,
    direction: random() > 0.4 ? 1 : -1,
  }));
  const budget = mobile ? density.mobile : density.desktop;
  const columns = Math.max(2, Math.ceil(width / budget.gateSpacing));
  const rows = Math.max(3, Math.ceil(height / 180));
  const gateCount = Math.min(budget.maxGates, columns * rows);
  const gates = Array.from({ length: gateCount }, (_, i) => {
    // Spread capped budgets across all rows, including very wide displays.
    const cell = Math.floor((i * columns * rows) / gateCount);
    return {
      x: (((cell % columns) + 0.2 + random() * 0.6) / columns) * width,
      y: ((Math.floor(cell / columns) + 0.2 + random() * 0.6) / rows) * height,
      size: 5 + random() * 13,
      phase: random() * Math.PI * 2,
      depth: 0.4 + random() * 0.6,
      bridge: i % 4 === 0,
    };
  });
  return {
    width,
    height,
    mobile,
    time: 0,
    travel: 0,
    activity: 0.45,
    lastInput: -10,
    pointer: {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      inside: false,
      strength: 0,
    },
    routes,
    packets,
    gates,
    waves: [],
    trail: [],
    quiet: [],
  };
}

export function movePointer(scene: Scene, point: Point) {
  const pointer = scene.pointer;
  if (!pointer.inside && pointer.strength < 0.01) {
    pointer.x = point.x;
    pointer.y = point.y;
  }
  pointer.targetX = point.x;
  pointer.targetY = point.y;
  pointer.inside = true;
  scene.lastInput = scene.time;
  const previous = scene.trail.at(-1);
  if (
    !previous ||
    Math.hypot(previous.x - point.x, previous.y - point.y) > 16
  ) {
    if (scene.trail.length >= HERO_SCENE.maxTrail) scene.trail.shift();
    scene.trail.push({ ...point, age: 0 });
  }
}

export function emitWave(scene: Scene, point: Point) {
  scene.lastInput = scene.time;
  const recent = scene.waves.find(
    (wave) =>
      wave.age < HERO_SCENE.mergeWindow &&
      Math.hypot(wave.x - point.x, wave.y - point.y) < HERO_SCENE.mergeDistance,
  );
  if (recent) {
    recent.power = Math.min(1.4, recent.power + 0.1);
    return false;
  }
  if (scene.waves.length >= HERO_SCENE.maxWaves) return false;
  scene.waves.push({
    ...point,
    age: 0,
    power: 1,
    variant: Math.floor(point.x / 170 + point.y / 130 + scene.time * 2) % 3,
  });
  return true;
}

export function stepScene(scene: Scene, elapsed: number) {
  const dt = Math.min(HERO_SCENE.maxFrameDelta, Math.max(0, elapsed));
  scene.time += dt;
  const active = scene.time - scene.lastInput < HERO_SCENE.idleAfter;
  scene.activity +=
    ((active ? 1 : 0.16) - scene.activity) * (1 - Math.exp(-dt * 2));
  scene.travel += dt * (0.4 + scene.activity * 0.6);
  const pointer = scene.pointer;
  const smoothing = 1 - Math.exp(-dt * 9);
  pointer.x += (pointer.targetX - pointer.x) * smoothing;
  pointer.y += (pointer.targetY - pointer.y) * smoothing;
  pointer.strength +=
    ((pointer.inside && active ? 1 : 0) - pointer.strength) *
    (1 - Math.exp(-dt * 4));
  for (const wave of scene.waves) wave.age += dt;
  for (const dot of scene.trail) dot.age += dt;
  scene.waves = scene.waves.filter((wave) => wave.age < HERO_SCENE.waveLife);
  scene.trail = scene.trail.filter((dot) => dot.age < HERO_SCENE.trailLife);
}

export function waveRadius(scene: Scene, wave: Wave) {
  const t = Math.min(1, wave.age / HERO_SCENE.waveLife);
  return (
    (scene.mobile ? HERO_SCENE.mobileWaveRadius : HERO_SCENE.waveRadius) *
    (1 - (1 - t) ** 3)
  );
}
export function displace(scene: Scene, point: Point, depth = 1): Point {
  const radius = scene.mobile
    ? HERO_SCENE.mobilePointerRadius
    : HERO_SCENE.pointerRadius;
  const dx = scene.pointer.x - point.x;
  const dy = scene.pointer.y - point.y;
  const pull =
    falloff(Math.hypot(dx, dy), radius) * scene.pointer.strength * depth * 0.22;
  let x = point.x + dx * pull;
  let y = point.y + dy * pull;
  for (const wave of scene.waves) {
    const wx = point.x - wave.x;
    const wy = point.y - wave.y;
    const distance = Math.hypot(wx, wy);
    const force =
      falloff(Math.abs(distance - waveRadius(scene, wave)), 45) *
      (1 - wave.age / HERO_SCENE.waveLife) *
      13 *
      wave.power *
      depth;
    if (distance > 0) {
      x += (wx / distance) * force;
      y += (wy / distance) * force;
    }
  }
  return { x, y };
}
export function pointOnRoute(route: Route, progress: number): Point {
  let remaining = (((progress % 1) + 1) % 1) * route.length;
  for (let i = 1; i < route.points.length; i++) {
    const a = route.points[i - 1];
    const b = route.points[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= length)
      return {
        x: a.x + ((b.x - a.x) * remaining) / length,
        y: a.y + ((b.y - a.y) * remaining) / length,
      };
    remaining -= length;
  }
  return route.points[0];
}
export function visibilityAt(scene: Scene, point: Point) {
  const edge =
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
      HERO_SCENE.edgeFade,
    );
  let quiet = 1;
  for (const box of scene.quiet) {
    const dx = Math.max(box.x - point.x, 0, point.x - box.x - box.width);
    const dy = Math.max(box.y - point.y, 0, point.y - box.y - box.height);
    quiet = Math.min(quiet, 1 - 0.9 * falloff(Math.hypot(dx, dy), 50));
  }
  return edge * quiet;
}
