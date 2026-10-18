# Kervan website

The product website and developer guides for [Kervan](https://github.com/KervanServer/kervan), published at **https://kervanserver.com** from this repository using GitHub Pages.

## Develop

Use Node **26.12.0** (`.node-version`) and npm **12.2.0** (`packageManager`). All direct dependency versions and the npm lockfile are pinned. The versions were checked against the official npm registry on October 18, 2026.

```sh
npm install --global npm@12.2.0
npm ci
npm run dev
```

## Verify the actual static export

```sh
npm run check
npm run typecheck
npm run build
npx playwright install chromium
npm test
npm run preview
```

`build` produces `out/`, normalizes Windows-specific Next.js RSC segment filenames and validates local links, exported routes, assets, `CNAME` and `.nojekyll`. The preview server serves that directory without a Next.js runtime. Guides use trailing-slash directory routes so direct loads and refreshes work on Pages.

The Playwright suite checks every page at **375, 768, 1024, 1440, 1920, 2560 and 3840px**, in both themes. It exercises theme selection, persistence, system changes, storage restrictions, cross-tab synchronization, keyboard controls, mobile navigation, code copying including failure feedback, tabs, FAQ and reduced motion. Axe checks the home page, a guide, brand assets and the open Appearance panel. Visual output is written under `test-results/visual/` (not committed). Use `PLAYWRIGHT_BASE_URL=https://kervanserver.com` to run against the deployed site.

## Publish

`.github/workflows/pages.yml` verifies the project, exports it, runs browser tests, and uploads `out/` to GitHub Pages on pushes to `main`. Pull requests run verification without deployment. Actions are pinned to the latest stable release SHAs verified during implementation.

In repository **Settings → Pages**, choose **GitHub Actions**, configure **kervanserver.com** as the custom domain, and enable HTTPS after GitHub provisions the certificate. `public/CNAME` and `public/.nojekyll` are copied to the export root.

The apex domain must resolve to GitHub Pages: A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; optional AAAA records are `2606:50c0:8000::153` through `2606:50c0:8003::153`. A `www` CNAME may point to `kervanserver.github.io` if desired. DNS administration is external to this repository.

## Content and branding

- Product facts, ports, configuration and commands are checked against the official repository, not the older feature illustration. See [research and provenance](docs/research.md).
- `src/lib/docs.ts` contains six source-linked guides; `src/lib/site.ts` centralizes upstream links and the reviewed source revision.
- All main theme and layout tokens are in `src/app/globals.css`. CSS `light-dark()` follows the operating system before JavaScript runs. A small head bootstrap applies persisted explicit choices before first paint.
- `public/brand/kervan-original.png` is the supplied artwork. `npm run brand` traces its actual silhouettes, including the original lettering, into SVG assets and regenerates the favicon and social card. It does not substitute a new font for the wordmark.
- The Appearance picker and OXOG mark/animation are adapted from the MIT-licensed [CobaltDB website](https://github.com/cobaltdb/cobaltdb-site). Preserve [the original MIT notice](docs/COBALT-LICENSE.txt). The OXOG mark retains its original paths, pink/purple colors, draw timings and reduced-motion behavior.
- The management UI illustration is explicitly labeled as illustrative sample data. It is not presented as a live dashboard or an actual product screenshot.

## Structure

```text
src/app/                  Pages, metadata, theme/layout CSS
src/components/           Shared UI, SVG diagrams, interactive controls
src/lib/                  Source-checked guides and site constants
public/                   Brand assets, icons, social image, CNAME
scripts/                  Asset tracing, export checks, static preview
tests/                    Browser and accessibility checks
docs/                     Research, attribution, validation evidence
```

MIT licensed. Kervan and OXOG brand assets retain their respective owners’ rights.
