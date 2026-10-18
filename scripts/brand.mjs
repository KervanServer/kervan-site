import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { ColorMode, PathSimplifyMode, vectorize } from "@neplex/vectorizer";
import sharp from "sharp";

// Mask and fit the actual supplied lettering/mark. Never substitute a font.
const source = "public/brand/kervan-original.png";
const colors = { gold: "#d7ad4f", navy: "#141522", cream: "#f6f3e9" };
function tracePolygon(mask, w, h) {
  const at = (x, y) =>
    x >= 0 && x < w && y >= 0 && y < h && mask[y * w + x] === 0;
  const edges = new Map();
  const add = (x, y, a, b) => {
    const key = `${x},${y}`;
    if (!edges.has(key)) edges.set(key, []);
    edges.get(key).push([a, b]);
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue;
      if (!at(x, y - 1)) add(x, y, x + 1, y);
      if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!at(x - 1, y)) add(x, y + 1, x, y);
    }
  const distance = (p, a, b) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(
        1,
        ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  const simplify = (points) => {
    if (points.length < 3) return points;
    let best = 1.5,
      index = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const d = distance(points[i], points[0], points.at(-1));
      if (d > best) {
        best = d;
        index = i;
      }
    }
    return index
      ? [
          ...simplify(points.slice(0, index + 1)).slice(0, -1),
          ...simplify(points.slice(index)),
        ]
      : [points[0], points.at(-1)];
  };
  const paths = [];
  while (edges.size) {
    const start = edges.keys().next().value;
    const points = [start.split(",").map(Number)];
    let key = start;
    do {
      const choices = edges.get(key);
      if (!choices?.length) break;
      const next = choices.pop();
      if (!choices.length) edges.delete(key);
      points.push(next);
      key = next.join(",");
    } while (key !== start);
    const area = Math.abs(
      points.reduce((sum, p, i) => {
        const q = points[(i + 1) % points.length];
        return sum + p[0] * q[1] - q[0] * p[1];
      }, 0) / 2,
    );
    if (area < 3) continue;
    const split = Math.floor(points.length / 2);
    const clean = [
      ...simplify(points.slice(0, split + 1)).slice(0, -1),
      ...simplify(points.slice(split)).slice(0, -1),
    ];
    paths.push(`M${clean.map((p) => p.join(" ")).join("L")}Z`);
  }
  return paths.join("");
}

async function trace(box, predicate) {
  const { data, info } = await sharp(source)
    .extract(box)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const mask = Buffer.alloc(width * height);
  for (let i = 0; i < mask.length; i++)
    mask[i] = predicate(...data.subarray(i * channels, i * channels + 3))
      ? 0
      : 255;
  const png = await sharp(mask, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
  const traced = await vectorize(png, {
    colorMode: ColorMode.Binary,
    hierarchical: 0,
    colorPrecision: 6,
    layerDifference: 5,
    mode: PathSimplifyMode.Spline,
    filterSpeckle: 1,
    cornerThreshold: 75,
    lengthThreshold: 1,
    spliceThreshold: 45,
    pathPrecision: 2,
    maxIterations: 10,
  });
  // VTracer emits absolute contours with independent translate transforms.
  // Bake each translation into the coordinates for identical React/SVG paths.
  const paths = Array.from(
    traced.matchAll(/<path\b([^>]+)\/?\s*>/g),
    ([, attributes]) => {
      const d = attributes.match(/\bd="([^"]+)"/)?.[1];
      assert.ok(
        d &&
          !d
            .match(/[A-Za-z]/g)
            ?.some((command) => !["M", "L", "C", "Q", "Z"].includes(command)),
        "Unexpected vector path commands",
      );
      const translation = attributes.match(
        /transform="translate\(([-\d.]+)[ ,]+([-\d.]+)\)"/,
      );
      assert.ok(translation, "Missing VTracer contour translation");
      const offset = [Number(translation[1]), Number(translation[2])];
      return d
        .replace(/[MLCQ][^MLCQZ]*/g, (segment) => {
          let index = 0;
          return segment.replace(/-?\d*\.?\d+/g, (value) =>
            String(Number((Number(value) + offset[index++ % 2]).toFixed(2))),
          );
        })
        .replaceAll(/\s+/g, " ")
        .trim();
    },
  );
  assert.ok(paths.length, "The supplied artwork produced no contours");
  let path = paths.join("");
  // Bound curve fitting against the source mask; reject drift in the real logo.
  async function agreement(candidate) {
    const proof = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/><path d="${candidate}" fill="black" fill-rule="evenodd"/></svg>`;
    const rendered = await sharp(Buffer.from(proof))
      .greyscale()
      .raw()
      .toBuffer();
    let intersection = 0,
      union = 0;
    for (let i = 0; i < mask.length; i++) {
      const expected = mask[i] === 0,
        actual = rendered[i] < 128;
      if (expected && actual) intersection++;
      if (expected || actual) union++;
    }
    return intersection / union;
  }
  let fidelity = await agreement(path);
  // Thin angular gold shapes must keep their original corners. Only use fitted
  // curves when they agree with the source; retain faithful polygon contours otherwise.
  if (fidelity < 0.94) {
    path = tracePolygon(mask, width, height);
    fidelity = await agreement(path);
  }
  assert.ok(
    fidelity >= 0.94,
    `Logo contours drifted from the source (${fidelity.toFixed(3)})`,
  );
  console.log(`Source silhouette agreement: ${(fidelity * 100).toFixed(1)}%`);
  return path;
}
const markBox = { left: 60, top: 140, width: 280, height: 116 };
const wordBox = { left: 58, top: 256, width: 280, height: 72 };
const gold = await trace(
  markBox,
  (r, g, b) => r > 105 && g > 65 && r > b * 1.45 && g > b * 1.25,
);
const bridge = await trace(markBox, (r, g, b) => r > 175 && g > 175 && b > 160);
const word = await trace(wordBox, (r, g, b) => r > 175 && g > 175 && b > 160);
await fs.writeFile(
  "src/components/brand-paths.ts",
  `// Curves fitted to the supplied Kervan artwork. Regenerate with npm run brand.\nexport const GOLD_PATH = ${JSON.stringify(gold)};\nexport const BRIDGE_PATH = ${JSON.stringify(bridge)};\nexport const WORD_PATH = ${JSON.stringify(word)};\n`,
);
const mark = (ink) =>
  `<path d="${gold}" fill="${colors.gold}" fill-rule="evenodd"/><path d="${bridge}" fill="${ink}" fill-rule="evenodd"/>`;
const wordmark = (ink) =>
  `<path d="${word}" fill="${ink}" fill-rule="evenodd"/>`;
const svg = (body, viewBox, title = "Kervan") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>`;
const horizontal = (ink) =>
  `<g transform="translate(0 6)">${mark(ink)}</g><g transform="translate(324 2.8) scale(1.7)">${wordmark(ink)}</g>`;
for (const [theme, ink] of [
  ["dark", colors.cream],
  ["light", colors.navy],
]) {
  await fs.writeFile(
    `public/brand/kervan-${theme}.svg`,
    svg(
      `${mark(ink)}<g transform="translate(0 116)">${wordmark(ink)}</g>`,
      "0 0 280 188",
      "Kervan stacked logo",
    ),
  );
  await fs.writeFile(
    `public/brand/kervan-horizontal-${theme}.svg`,
    svg(horizontal(ink), "0 0 800 128", "Kervan horizontal logo"),
  );
  await fs.writeFile(
    `public/brand/kervan-mark-${theme}.svg`,
    svg(mark(ink), "0 0 280 116", "Kervan connected hexagons mark"),
  );
  await fs.writeFile(
    `public/brand/kervan-wordmark-${theme}.svg`,
    svg(wordmark(ink), "0 0 280 72", "Kervan original wordmark"),
  );
}
// Keep the original mark URL working; add a conventional primary logo URL.
await fs.writeFile(
  "public/brand/kervan-mark.svg",
  svg(mark(colors.cream), "0 0 280 116", "Kervan connected hexagons mark"),
);
await fs.writeFile(
  "public/logo.svg",
  svg(horizontal(colors.navy), "0 0 800 128", "Kervan horizontal logo"),
);
const icon = svg(
  `<rect width="128" height="128" rx="28" fill="${colors.navy}"/><g transform="translate(4 38) scale(.43)">${mark(colors.cream)}</g>`,
  "0 0 128 128",
  "Kervan icon",
);
await fs.writeFile("public/icon.svg", icon);
for (const [size, filename] of [
  [180, "apple-touch-icon.png"],
  [192, "icon-192.png"],
  [512, "icon-512.png"],
])
  await sharp(Buffer.from(icon))
    .resize(size, size)
    .png()
    .toFile(`public/${filename}`);
// PNG-compressed ICO entries preserve transparency in modern browser favicons.
const sizes = [16, 32, 48];
const entries = await Promise.all(
  sizes.map((size) =>
    sharp(Buffer.from(icon)).resize(size, size).png().toBuffer(),
  ),
);
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (let i = 0; i < sizes.length; i++) {
  const cursor = 6 + i * 16;
  directory[cursor] = sizes[i];
  directory[cursor + 1] = sizes[i];
  directory.writeUInt16LE(1, cursor + 4);
  directory.writeUInt16LE(32, cursor + 6);
  directory.writeUInt32LE(entries[i].length, cursor + 8);
  directory.writeUInt32LE(offset, cursor + 12);
  offset += entries[i].length;
}
await fs.writeFile(
  "public/favicon.ico",
  Buffer.concat([directory, ...entries]),
);
await fs.writeFile(
  "public/manifest.webmanifest",
  `${JSON.stringify(
    {
      name: "Kervan",
      short_name: "Kervan",
      start_url: "/",
      display: "browser",
      background_color: colors.navy,
      theme_color: colors.navy,
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2,
  )}\n`,
);
const social = svg(
  `<rect width="1200" height="630" fill="${colors.navy}"/><path d="M0 520H1200M810 0V630" stroke="${colors.gold}" opacity=".16"/><g transform="translate(880 240) scale(.9)">${mark(colors.cream)}</g><g transform="translate(72 64) scale(.48)">${wordmark(colors.cream)}</g><text x="72" y="232" fill="${colors.cream}" font-family="sans-serif" font-size="75" font-weight="700">One binary.</text><text x="72" y="320" fill="${colors.gold}" font-family="sans-serif" font-size="75" font-weight="700">Every protocol.</text><text x="72" y="408" fill="${colors.cream}" font-family="sans-serif" font-size="75" font-weight="700">Total control.</text><text x="72" y="562" fill="${colors.gold}" font-family="monospace" font-size="21">FTP · FTPS · SFTP · SCP</text><text x="880" y="562" fill="${colors.cream}" font-family="monospace" font-size="19">kervanserver.com</text>`,
  "0 0 1200 630",
  "Kervan — One binary. Every protocol. Total control.",
);
await fs.writeFile("public/brand/social.svg", social);
await sharp(Buffer.from(social)).png().toFile("public/og.png");
console.log(
  "Generated curved vector logos, horizontal/stacked/mark/wordmark variants, browser/mobile icons, manifest and social image.",
);
