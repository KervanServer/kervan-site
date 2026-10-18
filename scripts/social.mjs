import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";

// Keep the share card reproducible from the real logo and the site's local fonts.
export async function generateSocialImage() {
  const [mark, wordmark, headingFont, bodyFont] = await Promise.all([
    fs.readFile("public/brand/kervan-mark-dark.svg", "utf8"),
    fs.readFile("public/brand/kervan-wordmark-dark.svg", "utf8"),
    fs.readFile(
      "node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
    ),
    fs.readFile(
      "node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
    ),
  ]);
  const paths = (source) => source.match(/<path\b[^>]*\/>/g).join("");
  const nodes = [
    {
      x: 776,
      y: 163,
      label: "FTP",
      route: "M824 199V226Q824 244 842 244H873V267",
    },
    {
      x: 1000,
      y: 163,
      label: "FTPS",
      route: "M1048 199V226Q1048 244 1030 244H999V267",
    },
    {
      x: 776,
      y: 433,
      label: "SFTP",
      route: "M824 433V414Q824 396 842 396H873V378",
    },
    {
      x: 1000,
      y: 433,
      label: "SCP",
      route: "M1048 433V414Q1048 396 1030 396H999V378",
    },
  ];
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none" role="img" aria-labelledby="title description">
  <title id="title">Kervan — One binary. Every protocol. Total control.</title>
  <desc id="description">FTP, FTPS, SFTP and SCP connect to a shared Kervan core. Pure Go, single binary, MIT license.</desc>
  <defs>
    <style>
      @font-face{font-family:Space;src:url(data:font/woff2;base64,${headingFont.toString("base64")}) format('woff2');font-weight:300 700}
      @font-face{font-family:Manrope;src:url(data:font/woff2;base64,${bodyFont.toString("base64")}) format('woff2');font-weight:200 800}
      text{font-family:Manrope,sans-serif}
      .headline{font-family:Space,sans-serif;font-size:76px;font-weight:600;letter-spacing:-3.5px}
      .label{font-size:12px;font-weight:600;letter-spacing:2px}
    </style>
    <radialGradient id="halo"><stop stop-color="#d7ad4f" stop-opacity=".1"/><stop offset="1" stop-color="#d7ad4f" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" stroke="#d7ad4f" stroke-opacity=".07"/></pattern>
    <linearGradient id="panel" x1="800" y1="260" x2="1080" y2="390" gradientUnits="userSpaceOnUse"><stop stop-color="#282735"/><stop offset="1" stop-color="#1a1b29"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#141522"/>
  <circle cx="946" cy="314" r="300" fill="url(#halo)"/>
  <rect x="734" y="104" width="402" height="412" fill="url(#grid)"/>
  <path d="M734 104H760M734 104V130M1136 104H1110M1136 104V130M734 516H760M734 516V490M1136 516H1110M1136 516V490" stroke="#d7ad4f" stroke-opacity=".3"/>
  <g transform="translate(64 47) scale(.38)">${paths(mark)}</g>
  <g transform="translate(188 53) scale(.5)">${paths(wordmark)}</g>
  <text x="1136" y="76" text-anchor="end" fill="#afadba" class="label">OPEN SOURCE FILE TRANSFER SERVER</text>
  <text x="64" y="210" fill="#f6f3e9" class="headline">One binary.</text>
  <text x="64" y="299" fill="#d7ad4f" class="headline">Every protocol.</text>
  <text x="64" y="388" fill="#f6f3e9" class="headline">Total control.</text>
  <text x="68" y="454" fill="#afadba" font-size="21">One filesystem. One auth engine.</text>
  <text x="68" y="485" fill="#afadba" font-size="21">One audit log.</text>
  <g stroke="#d7ad4f" stroke-width="1.5" stroke-opacity=".5">${nodes.map(({ route }) => `<path d="${route}"/>`).join("")}</g>
  <rect x="788" y="285" width="296" height="112" rx="18" fill="#191a28" stroke="#51432c"/>
  <rect x="788" y="276" width="296" height="112" rx="18" fill="#1c1d2b" stroke="#665330"/>
  <rect x="788" y="261" width="296" height="112" rx="18" fill="url(#panel)" stroke="#d7ad4f" stroke-opacity=".7"/>
  <g transform="translate(810 264) scale(.9)">${paths(mark)}</g>
  ${nodes.map(({ x, y, label }) => `<g><rect x="${x}" y="${y}" width="96" height="36" rx="8" fill="#1c1d2b" stroke="#51432c"/><circle cx="${x + 15}" cy="${y + 18}" r="3" fill="#d7ad4f"/><text x="${x + 56}" y="${y + 24}" text-anchor="middle" fill="#f6f3e9" font-size="15" font-weight="600">${label}</text></g>`).join("")}
  <path d="M64 538H1136" stroke="#323240"/>
  <g fill="#d7ad4f" class="label"><text x="68" y="583">PURE GO</text><text x="191" y="583">SINGLE BINARY</text><text x="378" y="583">MIT LICENSE</text></g>
  <g fill="#51432c"><circle cx="166" cy="579" r="2"/><circle cx="353" cy="579" r="2"/></g>
  <text x="1136" y="585" text-anchor="end" fill="#f6f3e9" font-size="22" font-weight="500">kervanserver.com</text>
</svg>`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<html><head><style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}svg{display:block}</style></head><body>${source}</body></html>`,
    );
    await page.evaluate(() => document.fonts.ready);
    assert(
      await page.evaluate(
        () =>
          document.fonts.check("600 76px Space") &&
          document.fonts.check("500 22px Manrope"),
      ),
      "The local brand fonts must load before rendering the share card.",
    );
    const png = await sharp(await page.screenshot())
      .png()
      .toBuffer();
    const metadata = await sharp(png).metadata();
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
    assert.equal(metadata.format, "png");
    await fs.writeFile("public/brand/social.svg", source);
    await fs.writeFile("public/og.png", png);
    console.log(
      `Generated public/og.png — 1200 × 630, ${png.length} bytes, local brand fonts loaded.`,
    );
  } finally {
    await browser.close();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await generateSocialImage();
}
