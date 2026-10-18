import {
  displace,
  HERO_SCENE,
  type Point,
  pointOnRoute,
  type Scene,
  visibilityAt,
  waveRadius,
} from "./hero-scene";

function hex(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation = 0,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6 + rotation;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

/** Drawing has no DOM reads. Geometry stays in CSS pixels at any render scale. */
export function drawHeroScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  dark: boolean,
  reduced: boolean,
) {
  const palette = HERO_SCENE.palettes[dark ? "dark" : "light"];
  const intro = reduced ? 1 : Math.min(1, scene.time / HERO_SCENE.intro);
  const envelope = intro * intro * (3 - 2 * intro);
  const ambient = envelope * (0.7 + scene.activity * 0.3);
  ctx.clearRect(0, 0, scene.width, scene.height);
  ctx.lineWidth = 0.7;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // Each segment is shaded independently so the text's quiet zones stay quiet.
  for (const route of scene.routes) {
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1];
      const b = route.points[i];
      const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      for (let stop = 0; stop <= 8; stop++) {
        const t = stop / 8;
        const alpha = visibilityAt(scene, {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
        });
        gradient.addColorStop(
          t,
          `rgba(${palette.wire.join(",")},${alpha * palette.route * route.depth * ambient})`,
        );
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = palette.gold;
  ctx.fillStyle = palette.gold;
  for (const packet of scene.packets) {
    const route = scene.routes[packet.route];
    const progress =
      packet.progress +
      (scene.travel * packet.speed * packet.direction) / route.length;
    const p = displace(scene, pointOnRoute(route, progress), route.depth);
    const tail = displace(
      scene,
      pointOnRoute(route, progress - (11 * packet.direction) / route.length),
      route.depth,
    );
    const opacity = visibilityAt(scene, p) * palette.packet * ambient;
    ctx.globalAlpha = opacity * 0.35;
    ctx.lineWidth = packet.size * 0.55;
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.globalAlpha = opacity;
    ctx.fillRect(
      p.x - packet.size / 2,
      p.y - packet.size / 2,
      packet.size * 1.8,
      packet.size,
    );
  }
  const connections: (Point & { distance: number })[] = [];
  for (const gate of scene.gates) {
    const p = displace(
      scene,
      {
        x: gate.x + Math.sin(scene.travel * 0.19 + gate.phase) * 7 * gate.depth,
        y:
          gate.y + Math.cos(scene.travel * 0.15 + gate.phase) * 10 * gate.depth,
      },
      gate.depth,
    );
    ctx.globalAlpha =
      visibilityAt(scene, p) * palette.node * gate.depth * ambient;
    ctx.lineWidth = 0.8;
    hex(ctx, p.x, p.y, gate.size);
    if (gate.bridge) {
      hex(ctx, p.x - gate.size * 1.8, p.y, gate.size * 0.68);
      hex(ctx, p.x + gate.size * 1.8, p.y, gate.size * 0.68);
      ctx.beginPath();
      ctx.moveTo(p.x - gate.size * 1.8, p.y);
      ctx.lineTo(p.x + gate.size * 1.8, p.y);
      ctx.stroke();
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    } else if (gate.size > 11) {
      ctx.beginPath();
      ctx.moveTo(p.x - 3, p.y);
      ctx.lineTo(p.x + 3, p.y);
      ctx.moveTo(p.x, p.y - 3);
      ctx.lineTo(p.x, p.y + 3);
      ctx.stroke();
    }
    const distance = Math.hypot(scene.pointer.x - p.x, scene.pointer.y - p.y);
    if (distance < HERO_SCENE.pointerRadius && !scene.mobile)
      connections.push({ ...p, distance });
  }
  if (!reduced) {
    for (const p of connections
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)) {
      ctx.globalAlpha =
        (1 - p.distance / HERO_SCENE.pointerRadius) *
        scene.pointer.strength *
        palette.effect *
        visibilityAt(scene, p) *
        envelope;
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(scene.pointer.x, scene.pointer.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    for (const dot of scene.trail) {
      const life = 1 - dot.age / HERO_SCENE.trailLife;
      ctx.globalAlpha =
        life * life * 0.22 * visibilityAt(scene, dot) * envelope;
      ctx.lineWidth = 0.65;
      hex(ctx, dot.x, dot.y, 3 + (1 - life) * 9);
    }
    for (const wave of scene.waves) {
      const life = 1 - wave.age / HERO_SCENE.waveLife;
      const radius = waveRadius(scene, wave);
      // A short attack and quadratic decay avoid flashes on press or release.
      const fade =
        Math.min(1, wave.age / 0.08) *
        life *
        life *
        palette.effect *
        wave.power *
        envelope;
      ctx.globalAlpha = fade;
      ctx.lineWidth = 0.7 + life * 0.7;
      // Clip by a soft edge mask applied to the entire decorative canvas in CSS.
      if (wave.variant === 1) hex(ctx, wave.x, wave.y, radius, Math.PI / 6);
      else {
        ctx.beginPath();
        for (let i = 0; i < (wave.variant === 2 ? 4 : 1); i++) {
          const start = (i * Math.PI) / 2 + wave.age * 0.12;
          ctx.moveTo(
            wave.x + Math.cos(start) * radius,
            wave.y + Math.sin(start) * radius,
          );
          ctx.arc(
            wave.x,
            wave.y,
            radius,
            start,
            start + (wave.variant === 2 ? Math.PI / 3 : Math.PI * 2),
          );
        }
        ctx.stroke();
      }
      ctx.globalAlpha = fade * 0.35;
      hex(ctx, wave.x, wave.y, 8 + radius * 0.3);
      const sparks = scene.mobile
        ? HERO_SCENE.density.mobile.sparks
        : HERO_SCENE.density.desktop.sparks;
      for (let i = 0; i < sparks; i++) {
        const angle = (i / sparks) * Math.PI * 2 + wave.variant * 0.4;
        const p = {
          x: wave.x + Math.cos(angle) * radius * 0.82,
          y: wave.y + Math.sin(angle) * radius * 0.82,
        };
        ctx.globalAlpha = fade * visibilityAt(scene, p);
        const size = 1 + life * 2;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }
    }
  }
  ctx.globalAlpha = 1;
}
