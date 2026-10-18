import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("out");
assert.equal(
  (await readFile(path.join(root, "CNAME"), "utf8")).trim(),
  "kervanserver.com",
);
for (const file of [
  ".nojekyll",
  "index.html",
  "404.html",
  "docs/index.html",
  "docs/getting-started/index.html",
  "docs/protocols/index.html",
  "docs/storage/index.html",
  "docs/security/index.html",
  "docs/operations/index.html",
  "docs/api/index.html",
  "brand/index.html",
  "icon.svg",
  "favicon.ico",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "og.png",
  "sitemap.xml",
  "robots.txt",
])
  await stat(path.join(root, file));
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name),
      ),
    )
  ).flat();
}
const html = (await walk(root)).filter((f) => f.endsWith(".html"));
const broken = [];
for (const file of html) {
  const source = await readFile(file, "utf8");
  for (const [, href] of source.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const clean = decodeURIComponent(href.split(/[?#]/)[0]);
    let target = path.join(root, clean);
    if (clean.endsWith("/")) target = path.join(target, "index.html");
    try {
      await stat(target);
    } catch {
      broken.push(`${path.relative(root, file)} → ${clean}`);
    }
  }
  assert.ok(!source.includes('href="#"'), `${file}: empty link`);
}
assert.deepEqual(broken, [], `Broken local links/assets: ${broken.join(", ")}`);
console.log(
  `Static export verified: ${html.length} HTML files; routes, local links, assets, CNAME and .nojekyll present.`,
);
