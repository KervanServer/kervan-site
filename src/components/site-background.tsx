"use client";

import { useEffect, useId, useRef } from "react";
import { useAnimationsEnabled } from "@/lib/animation-preference";
import {
  BACKGROUND,
  type Box,
  cellPoint,
  createBackground,
  edgeOpacity,
  emitWave,
  falloff,
  inBox,
  isTap,
  movePointer,
  type Point,
  packetPoint,
  stepBackground,
  type Wave,
  waveLife,
  waveRadius,
} from "@/lib/background-scene";

const NS = "http://www.w3.org/2000/svg";
const controls =
  "a,button,input,select,textarea,summary,label,[role='button'],[role='tab'],[contenteditable],[data-background-quiet]";
const quietContent = `${controls},h1,h2,h3,p,li,pre,table,aside,figcaption,.eyebrow,.hero-command,.hero-trust,.hero-art,.feature-featured,.feature-number,.protocol-explorer,.architecture-diagram,.management-preview,.use-cases article,.use-case-tag,.studio-card,.studio-signature,.brand-preview,.brand-colors,.code-block,.capability-inner,.built-go,.footer-bottom,.docs-meta,.docs-breadcrumb,.docs-category`;
// Hover always tracks across content. Only actual controls opt out of click bursts.
const excludedInput = `${controls},header,nav`;
const number = (value: number) => value.toFixed(2);

function makeSvg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number> = {},
) {
  const element = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes))
    element.setAttribute(name, String(value));
  return element;
}

/** One viewport-sized SVG follows the document. Only visible cells are animated. */
export function SiteBackground() {
  const enabled = useAnimationsEnabled();
  const id = `field-${useId().replace(/:/g, "")}`;
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const ambient = useRef<SVGGElement>(null);
  const effects = useRef<SVGGElement>(null);
  const connections = useRef<SVGGElement>(null);
  const interaction = useRef<SVGGElement>(null);
  const feather = useRef<SVGFilterElement>(null);
  const quiet = useRef<SVGGElement>(null);
  useEffect(() => {
    if (
      !enabled ||
      !root.current ||
      !svg.current ||
      !ambient.current ||
      !effects.current ||
      !connections.current ||
      !interaction.current ||
      !feather.current ||
      !quiet.current
    )
      return;
    const host = root.current;
    const viewport = svg.current;
    const field = ambient.current;
    const pulses = effects.current;
    const links = connections.current;
    const cutouts = quiet.current;
    const response = interaction.current;
    const featherFilter = feather.current;
    const cursor = makeSvg("g", { class: "field-cursor", opacity: 0 });
    const aura = makeSvg("circle", { r: 140, fill: `url(#${id}-aura)` });
    const orbit = makeSvg("circle", { r: 32, class: "field-cursor-orbit" });
    cursor.append(aura, orbit);
    const trail = makeSvg("path", { class: "field-trail", opacity: 0 });
    const motes = Array.from(
      { length: BACKGROUND.pointerMotes },
      (_, index) => {
        const mote = makeSvg("use", {
          href: `#${id}-${index % 3 === 0 ? "hex" : "diamond"}`,
          class: "field-mote",
          opacity: 0,
        });
        return mote;
      },
    );
    response.append(trail, cursor, ...motes);
    let scene = createBackground(1, 1);
    let nodes: {
      group: SVGGElement;
      shape: SVGUseElement;
      packet: SVGRectElement;
      row: number | undefined;
    }[] = [];
    let boxes: Box[] = [];
    let sticky: Element[] = [];
    let inkZones: Box[] = [];
    let needsMeasure = true;
    let maskDirty = true;
    let visible = false;
    let disposed = false;
    let raf = 0;
    let previous = 0;
    let drawn = 0;
    let press:
      | (Point & { time: number; pointerId: number; moved: boolean })
      | null = null;
    const makeWaveNodes = (count: number, echo = false) =>
      Array.from({ length: count }, () => {
        const group = makeSvg("g", {
          class: echo ? "field-echo" : "field-wave",
          display: "none",
        });
        const ring = makeSvg("g", { class: "field-wave-ring" });
        ring.append(
          makeSvg("circle", { r: 1, class: "field-wave-circle" }),
          makeSvg("use", { href: `#${id}-hex`, class: "field-wave-hex" }),
        );
        const core = makeSvg("use", {
          href: `#${id}-hex`,
          class: "field-wave-core",
        });
        const sparks = Array.from(
          { length: echo ? 0 : BACKGROUND.sparks },
          () =>
            makeSvg("rect", {
              x: -1,
              y: -1,
              width: 2,
              height: 2,
              class: "field-spark",
            }),
        );
        group.append(ring, core, ...sparks);
        pulses.append(group);
        return { group, ring, core, sparks };
      });
    const effectNodes = makeWaveNodes(BACKGROUND.maxWaves);
    const echoNodes = makeWaveNodes(BACKGROUND.maxEchoes, true);
    const linkNodes = Array.from({ length: BACKGROUND.connections }, () => {
      const line = makeSvg("line", { class: "field-connection", opacity: 0 });
      links.append(line);
      return line;
    });
    const maskNodes: { outer: SVGRectElement; inner: SVGRectElement }[] = [];
    const documentBox = (element: Element): Box => {
      const box = element.getBoundingClientRect();
      return {
        x: box.left,
        y: box.top + window.scrollY,
        width: box.width,
        height: box.height,
      };
    };
    function measure() {
      needsMeasure = false;
      scene.scroll = window.scrollY;
      const candidates = Array.from(
        document.querySelectorAll(
          `main :is(${quietContent}),footer :is(${quietContent}),header`,
        ),
      );
      const elements = candidates.filter(
        (element) => !element.parentElement?.closest(quietContent),
      );
      sticky = elements.filter(
        (element) => getComputedStyle(element).position === "sticky",
      );
      boxes = elements
        .filter((element) => !sticky.includes(element))
        .map(documentBox)
        .filter((box) => box.width > 0 && box.height > 0);
      inkZones = Array.from(document.querySelectorAll(".cta-section")).map(
        documentBox,
      );
      maskDirty = true;
    }
    function updateMask() {
      maskDirty = false;
      const current = [...boxes, ...sticky.map(documentBox)].filter(
        (box) =>
          box.y + box.height > scene.scroll - 20 &&
          box.y < scene.scroll + scene.height + 20,
      );
      current.forEach((box, index) => {
        if (!maskNodes[index]) {
          const outer = makeSvg("rect", {
            fill: "black",
            opacity: 0.55,
            rx: 12,
          });
          const inner = makeSvg("rect", { fill: "black", opacity: 0.8, rx: 7 });
          cutouts.append(outer, inner);
          maskNodes.push({ outer, inner });
        }
        const { outer, inner } = maskNodes[index];
        for (const [node, pad] of [
          [outer, 11],
          [inner, 5],
        ] as const) {
          node.removeAttribute("display");
          node.setAttribute("x", number(box.x - pad));
          node.setAttribute("y", number(box.y - scene.scroll - pad));
          node.setAttribute("width", number(box.width + pad * 2));
          node.setAttribute("height", number(box.height + pad * 2));
        }
      });
      for (let index = current.length; index < maskNodes.length; index++) {
        maskNodes[index].outer.setAttribute("display", "none");
        maskNodes[index].inner.setAttribute("display", "none");
      }
    }
    const tone = (point: Point) =>
      inkZones.some((box) =>
        inBox({ x: point.x, y: point.y + scene.scroll }, box),
      )
        ? "ink"
        : "gold";
    function paint() {
      if (needsMeasure) measure();
      if (maskDirty) updateMask();
      const pointer = scene.pointer;
      const strength = scene.mobile ? 0 : pointer.strength;
      response.dataset.active = String(strength > 0.02);
      response.setAttribute("data-x", number(pointer.targetX));
      response.setAttribute("data-y", number(pointer.targetY));
      cursor.setAttribute("opacity", number(strength));
      cursor.setAttribute(
        "transform",
        `translate(${number(pointer.x)} ${number(pointer.y)})`,
      );
      cursor.dataset.tone = tone(pointer);
      orbit.setAttribute("transform", `rotate(${number(scene.travel * 25)})`);
      const points = scene.trail;
      trail.setAttribute(
        "opacity",
        number(
          points.length > 1
            ? strength * (1 - points[0].age / BACKGROUND.trailLife)
            : 0,
        ),
      );
      trail.setAttribute(
        "d",
        points.length > 1
          ? points
              .map((point, index) => {
                if (!index) return `M${number(point.x)} ${number(point.y)}`;
                const next = points[index + 1] ?? point;
                return `Q${number(point.x)} ${number(point.y)} ${number((point.x + next.x) / 2)} ${number((point.y + next.y) / 2)}`;
              })
              .join(" ")
          : "",
      );
      trail.dataset.tone = tone(pointer);
      motes.forEach((mote, index) => {
        if (strength < 0.01) {
          mote.setAttribute("opacity", "0");
          return;
        }
        const point = scene.motes[index];
        const angle =
          Math.atan2(point.y - pointer.y, point.x - pointer.x) + point.spin;
        const radius = Math.hypot(point.x - pointer.x, point.y - pointer.y);
        mote.setAttribute(
          "transform",
          `translate(${number(point.x)} ${number(point.y)}) rotate(${number(angle * 57.3)}) scale(${number((0.3 + (index % 3) * 0.1) * (1 + point.energy * 0.16))})`,
        );
        mote.setAttribute(
          "opacity",
          number(
            strength *
              (0.32 +
                falloff(radius, BACKGROUND.pointerRadius) * 0.4 +
                point.energy * 0.12),
          ),
        );
        mote.dataset.tone = tone(point);
      });
      const nearby: (Point & { distance: number })[] = [];
      scene.cells.forEach((cell, index) => {
        const base = cellPoint(scene, cell);
        const node = nodes[index];
        const value = cell.value;
        if (!value) return;
        if (
          base.x < 0 ||
          base.x > scene.width ||
          base.y < 0 ||
          base.y > scene.height
        ) {
          if (node.group.getAttribute("display") !== "none")
            node.group.setAttribute("display", "none");
          return;
        }
        const point = { x: base.x + cell.flow.x, y: base.y + cell.flow.y };
        node.group.removeAttribute("display");
        node.group.setAttribute(
          "transform",
          `translate(${number(point.x)} ${number(point.y)})`,
        );
        node.group.setAttribute(
          "opacity",
          number(
            edgeOpacity(scene, point) *
              (0.42 + cell.depth) *
              (0.8 + scene.activity * 0.2),
          ),
        );
        node.group.dataset.tone = tone(point);
        if (node.row !== value.row) {
          node.row = value.row;
          node.shape.setAttribute(
            "href",
            `#${id}-${["gate", "hex", "diamond", "orbit"][value.kind]}`,
          );
        }
        const angle =
          Math.sin(scene.travel * 0.09 + value.phase) * 8 +
          cell.flow.spin * 57.3;
        node.shape.setAttribute(
          "transform",
          `rotate(${number(angle)}) scale(${number((value.size / 12) * (1 + cell.flow.energy * 0.12))})`,
        );
        const packet = packetPoint(
          value.phase + scene.travel * value.speed * value.direction,
        );
        node.packet.setAttribute(
          "transform",
          `translate(${number(packet.x)} ${number(packet.y)})`,
        );
        node.packet.setAttribute("opacity", number(1 - falloffEdge(packet.x)));
        const distance = Math.hypot(
          point.x - scene.pointer.x,
          point.y - scene.pointer.y,
        );
        if (!scene.mobile && distance < BACKGROUND.pointerRadius)
          nearby.push({ ...point, distance });
      });
      nearby.sort((a, b) => a.distance - b.distance);
      linkNodes.forEach((line, index) => {
        const point = nearby[index];
        const opacity = point
          ? (1 - point.distance / BACKGROUND.pointerRadius) *
            scene.pointer.strength *
            0.75
          : 0;
        line.setAttribute("opacity", number(opacity));
        if (!point || opacity < 0.01) return;
        line.setAttribute("x1", number(scene.pointer.x));
        line.setAttribute("y1", number(scene.pointer.y));
        line.setAttribute("x2", number(point.x));
        line.setAttribute("y2", number(point.y));
        line.dataset.tone = tone(point);
      });
      const paintWaves = (pool: typeof effectNodes, waves: Wave[]) =>
        pool.forEach((node, index) => {
          const wave = waves[index];
          if (!wave) {
            node.group.setAttribute("display", "none");
            return;
          }
          const point = { x: wave.x, y: wave.y - scene.scroll };
          const radius = waveRadius(scene, wave);
          if (point.y + radius < 0 || point.y - radius > scene.height) {
            node.group.setAttribute("display", "none");
            return;
          }
          const life = 1 - wave.age / waveLife(wave);
          node.group.removeAttribute("display");
          node.group.dataset.variant = String(wave.variant);
          node.group.dataset.tone = tone(point);
          node.group.setAttribute(
            "transform",
            `translate(${number(point.x)} ${number(point.y)})`,
          );
          node.group.setAttribute(
            "opacity",
            number(Math.min(1, wave.age / 0.1) * life * life * wave.power),
          );
          node.ring.setAttribute(
            "transform",
            `scale(${number(Math.max(0.01, radius))})`,
          );
          node.core.setAttribute(
            "transform",
            `scale(${number((8 + radius * 0.28) / 12)})`,
          );
          const count = scene.mobile
            ? BACKGROUND.mobileSparks
            : BACKGROUND.sparks;
          node.sparks.forEach((spark, i) => {
            spark.setAttribute("display", i >= count ? "none" : "inline");
            if (i >= count) return;
            const angle = (i / count) * Math.PI * 2 + wave.variant * 0.4;
            spark.setAttribute(
              "transform",
              `translate(${number(Math.cos(angle) * radius * 0.82)} ${number(Math.sin(angle) * radius * 0.82)}) rotate(45) scale(${number(0.5 + life)})`,
            );
          });
        });
      paintWaves(effectNodes, scene.waves);
      paintWaves(echoNodes, scene.echoes);
    }
    function falloffEdge(x: number) {
      return Math.max(0, Math.min(1, (Math.abs(x) - 75) / 21));
    }
    function frame(timestamp: number) {
      raf = 0;
      if (disposed || document.hidden || !visible) return;
      // Keep text cutouts aligned at display cadence, even on 20/30fps scenes.
      if (needsMeasure) measure();
      if (maskDirty) updateMask();
      stepBackground(scene, previous ? (timestamp - previous) / 1000 : 0);
      previous = timestamp;
      const fps = scene.mobile
        ? BACKGROUND.mobileFrameRate
        : BACKGROUND.frameRate;
      if (timestamp - drawn >= 1000 / fps) {
        paint();
        drawn = timestamp;
      }
      raf = requestAnimationFrame(frame);
    }
    function requestPaint() {
      if (!disposed && !raf && visible && !document.hidden)
        raf = requestAnimationFrame(frame);
    }
    function resize() {
      if (disposed) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      if (scene.width !== width || scene.height !== height) {
        const next = createBackground(width, height);
        next.time = scene.time;
        next.travel = scene.travel;
        next.activity = scene.activity;
        scene = next;
        scene.scroll = window.scrollY;
        field.replaceChildren();
        nodes = scene.cells.map(() => {
          const group = makeSvg("g", { class: "field-cell" });
          const route = makeSvg("use", {
            href: `#${id}-route`,
            class: "field-route",
          });
          const shape = makeSvg("use", { class: "field-shape" });
          const packet = makeSvg("rect", {
            x: -2,
            y: -1,
            width: 4,
            height: 2,
            class: "field-packet",
          });
          group.append(route, shape, packet);
          field.append(group);
          return { group, shape, packet, row: undefined };
        });
        viewport.setAttribute("viewBox", `0 0 ${width} ${height}`);
        featherFilter.setAttribute("width", String(width + 128));
        featherFilter.setAttribute("height", String(height + 128));
      }
      needsMeasure = true;
      requestPaint();
    }
    function synchronize() {
      if (disposed) return;
      cancelAnimationFrame(raf);
      raf = 0;
      previous = 0;
      drawn = 0;
      press = null;
      scene.waves = [];
      scene.echoes = [];
      for (const cell of scene.cells) {
        Object.assign(cell.flow, {
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          energy: 0,
          spin: 0,
        });
      }
      for (const mote of scene.motes) {
        mote.active = false;
        mote.energy = mote.spin = 0;
      }
      scene.trail = [];
      scene.pointer.inside = false;
      scene.pointer.strength = 0;
      host.dataset.motion = visible && !document.hidden ? "running" : "paused";
      requestPaint();
    }
    const protectedTarget = (event: PointerEvent) =>
      event.target instanceof Element && !!event.target.closest(excludedInput);
    function move(event: PointerEvent) {
      if (
        press &&
        (event.pointerId !== press.pointerId ||
          Math.hypot(event.clientX - press.x, event.clientY - press.y) >
            BACKGROUND.tapDistance)
      )
        press.moved = true;
      if (event.pointerType === "touch") {
        scene.pointer.inside = false;
        return;
      }
      movePointer(scene, { x: event.clientX, y: event.clientY });
    }
    function down(event: PointerEvent) {
      press = null;
      if (!event.isPrimary || event.button !== 0 || protectedTarget(event))
        return;
      press = {
        x: event.clientX,
        y: event.clientY,
        time: performance.now() / 1000,
        pointerId: event.pointerId,
        moved: false,
      };
    }
    function up(event: PointerEvent) {
      const start = press;
      press = null;
      if (
        !start ||
        start.moved ||
        start.pointerId !== event.pointerId ||
        protectedTarget(event) ||
        !window.getSelection()?.isCollapsed
      )
        return;
      const end = {
        x: event.clientX,
        y: event.clientY,
        time: performance.now() / 1000,
      };
      if (isTap(start, end)) emitWave(scene, end);
    }
    function leave() {
      scene.pointer.inside = false;
      press = null;
    }
    function scroll() {
      scene.scroll = window.scrollY;
      maskDirty = true;
      press = null;
      if (scene.pointer.inside) scene.lastInput = scene.time;
      requestPaint();
    }
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      synchronize();
    });
    const sizing = new ResizeObserver(resize);
    const layout = new ResizeObserver(() => {
      needsMeasure = true;
      requestPaint();
    });
    const mutations = new MutationObserver((records) => {
      if (records.some((record) => !host.contains(record.target))) {
        needsMeasure = true;
        requestPaint();
      }
    });
    resize();
    observer.observe(host);
    sizing.observe(host);
    layout.observe(document.body);
    // Client navigation can replace main. Ignore our own SVG's child mutations.
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open", "hidden"],
    });
    document.fonts.ready.then(() => {
      if (!disposed) {
        needsMeasure = true;
        requestPaint();
      }
    });
    host.dataset.ready = "true";
    document.addEventListener("visibilitychange", synchronize);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("pointermove", move, {
      passive: true,
      capture: true,
    });
    window.addEventListener("pointerdown", down, {
      passive: true,
      capture: true,
    });
    window.addEventListener("pointerup", up, { passive: true, capture: true });
    window.addEventListener("pointercancel", leave, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave, {
      passive: true,
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      sizing.disconnect();
      layout.disconnect();
      mutations.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
      field.replaceChildren();
      pulses.replaceChildren();
      links.replaceChildren();
      cutouts.replaceChildren();
      response.replaceChildren();
      response.dataset.active = "false";
      response.removeAttribute("data-x");
      response.removeAttribute("data-y");
    };
  }, [id, enabled]);
  return (
    <div
      className="site-background"
      ref={root}
      aria-hidden="true"
      data-enabled={enabled}
      data-motion={enabled ? undefined : "off"}
      data-ready={enabled ? undefined : "false"}
    >
      <svg ref={svg} xmlns={NS} aria-hidden="true" focusable="false">
        <defs>
          <g id={`${id}-hex`}>
            <path
              d="M0-12 10.4-6V6L0 12-10.4 6V-6Z"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          </g>
          <g id={`${id}-gate`}>
            <path d="m-20-9 8 4.5v9l-8 4.5-8-4.5v-9Zm20-3 10.4 6v12L0 12-10.4 6V-6Zm20 3 8 4.5v9L20 9l-8-4.5v-9ZM-20 0H20" />
            <circle cx="-20" r="1.6" />
            <circle cx="20" r="1.6" />
          </g>
          <g id={`${id}-diamond`}>
            <path d="m0-12 12 12L0 12-12 0Zm-3 12H3M0-3V3" />
          </g>
          <g id={`${id}-orbit`}>
            <circle r="11" />
            <path d="M-16 0H16M0-3V3" />
            <rect x="8" y="-10" width="4" height="4" />
          </g>
          <path id={`${id}-route`} d="M-96 24H-46L-22 0H24L48-24H96" />
          <radialGradient id={`${id}-aura`}>
            <stop stopColor="var(--field-glow)" stopOpacity=".19" />
            <stop
              offset=".35"
              stopColor="var(--field-glow)"
              stopOpacity=".09"
            />
            <stop offset="1" stopColor="var(--field-glow)" stopOpacity="0" />
          </radialGradient>
          <filter
            ref={feather}
            id={`${id}-feather`}
            filterUnits="userSpaceOnUse"
            x="-64"
            y="-64"
          >
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <mask
            id={`${id}-quiet`}
            maskUnits="userSpaceOnUse"
            style={{ maskType: "luminance" }}
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <rect width="100%" height="100%" fill="white" />
            <g ref={quiet} filter={`url(#${id}-feather)`} />
          </mask>
        </defs>
        <g mask={`url(#${id}-quiet)`}>
          <g ref={ambient} className="field-ambient" />
        </g>
        <g className="field-response">
          <g ref={connections} />
          <g ref={effects} />
          <g ref={interaction} className="field-interaction" />
        </g>
      </svg>
    </div>
  );
}
