import fs from "node:fs/promises";
import sharp from "sharp";

// Trace the supplied artwork's silhouettes, including its original lettering.
// No replacement font or reinterpreted mark is used.
const source = "public/brand/kervan-original.png";
async function trace(box, predicate) {
  const { data, info } = await sharp(source)
    .extract(box)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const mask = Array.from({ length: w * h }, (_, i) =>
    predicate(...data.subarray(i * c, i * c + 3)),
  );
  const at = (x, y) => x >= 0 && x < w && y >= 0 && y < h && mask[y * w + x];
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
    let best = 0.55,
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
  `// Silhouettes traced from the user-supplied Kervan artwork. Regenerate with npm run brand.\nexport const GOLD_PATH = ${JSON.stringify(gold)};\nexport const BRIDGE_PATH = ${JSON.stringify(bridge)};\nexport const WORD_PATH = ${JSON.stringify(word)};\n`,
);
const mark = (ink) =>
  `<path d="${gold}" fill="#d7ad4f" fill-rule="evenodd"/><path d="${bridge}" fill="${ink}" fill-rule="evenodd"/>`;
const svg = (body, viewBox) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">${body}</svg>`;
await fs.writeFile(
  "public/brand/kervan-mark.svg",
  svg(mark("#f6f3e9"), "0 0 280 116"),
);
for (const [theme, ink] of [
  ["dark", "#f6f3e9"],
  ["light", "#171826"],
]) {
  await fs.writeFile(
    `public/brand/kervan-${theme}.svg`,
    svg(
      `${mark(ink)}<path transform="translate(0 116)" d="${word}" fill="${ink}" fill-rule="evenodd"/>`,
      "0 0 280 188",
    ),
  );
}
const icon = svg(
  `<rect width="128" height="128" rx="28" fill="#171826"/><g transform="translate(4 38) scale(.43)">${mark("#f6f3e9")}</g>`,
  "0 0 128 128",
);
await fs.writeFile("public/icon.svg", icon);
await sharp(Buffer.from(icon))
  .resize(180, 180)
  .png()
  .toFile("public/apple-touch-icon.png");
const social = svg(
  `<rect width="1200" height="630" fill="#141522"/><path d="M0 520H1200M810 0V630" stroke="#d7ad4f" opacity=".16"/><g transform="translate(880 240) scale(.9)">${mark("#f6f3e9")}</g><g transform="translate(72 64) scale(.48)"><path d="${word}" fill="#f6f3e9" fill-rule="evenodd"/></g><text x="72" y="232" fill="#f6f3e9" font-family="sans-serif" font-size="75" font-weight="700">One binary.</text><text x="72" y="320" fill="#d7ad4f" font-family="sans-serif" font-size="75" font-weight="700">Every protocol.</text><text x="72" y="408" fill="#f6f3e9" font-family="sans-serif" font-size="75" font-weight="700">Total control.</text><text x="72" y="562" fill="#d7ad4f" font-family="monospace" font-size="21">FTP · FTPS · SFTP · SCP</text><text x="880" y="562" fill="#f6f3e9" font-family="monospace" font-size="19">kervanserver.com</text>`,
  "0 0 1200 630",
);
await fs.writeFile("public/brand/social.svg", social);
await sharp(Buffer.from(social)).png().toFile("public/og.png");
console.log(
  "Traced original mark and wordmark; generated light/dark SVGs, favicon, Apple icon, and social image.",
);
