# Research and provenance

Reviewed October 18, 2026. Product source: [KervanServer/kervan](https://github.com/KervanServer/kervan), revision `3eb2333475ce4cb924fe27b98c31e0c2d86135f6`. Latest published release: `v0.9.0` (October 14, 2026). Source snapshots were read separately from the website checkout; the product repository was not changed.

## Product evidence

| Website subject | Primary evidence |
| --- | --- |
| Purpose, deployment, commands, feature boundaries | `README.md` and `cmd/kervan/main.go` |
| Listener ports, TLS defaults, config keys and environment overlay | `kervan.example.yaml`, `internal/config`, README configuration section |
| Shared auth, VFS, session, audit and transfer services | `internal/server/server.go` and its imported service packages |
| Local, memory and S3 backends | `internal/storage/`, README VFS section |
| S3 single-PUT and staging limits | README VFS section; multipart explicitly remains planned |
| Identity, OIDC, SSH keys, account restrictions | README Authentication, SSO and Security sections |
| Audit integrity, delivery limits, backups | README Audit Log section and example audit configuration |
| API and WebSocket surfaces | `docs/openapi.yaml`, README REST API section |
| Container defaults and persistence | `Dockerfile`, `scripts/docker-entrypoint.sh`, `docker-compose.yml` |
| Linux service | `deploy/systemd/kervan.service` |
| Requirements, license and contributing | `go.mod`, `LICENSE`, `CONTRIBUTING.md` |

The supplied infographic predates shipped S3, LDAP, OIDC and other capabilities. Its palette and identity were used for branding; current source determines technical claims. No customer claims, fabricated benchmarks, adoption counts or security certifications are included. OIDC is described as WebUI/API SSO, not authentication for every transfer protocol. Backup guidance distinguishes operational state from file payloads.

## Design references

All seven requested sites returned HTTP 200 during direct inspection. Some were unavailable to the search crawler, so their live HTML was read directly. Their document headings, page progression, SVG usage, code treatments, CSS breakpoints and footer structures were inspected.

| Reference | Observed pattern informing the Kervan design |
| --- | --- |
| [DockRouter](https://dockrouter.com) | Direct two-part hero, connected route diagrams, Compose-to-live narrative, ecosystem footer |
| [UWAS](https://uwaserver.com) | Single-binary positioning, readable configuration, embedded control-panel section, MCP explanation |
| [NothingDNS](https://nothingdns.com) | Strong type hierarchy, network-flow artwork, configuration-led onboarding, generous alternating sections |
| [CobaltDB](https://cobaltdb.dev) | Isometric technical artwork, product-to-guides flow, source-grounded caveats, exact Appearance picker and OXOG footer reference |
| [GuardianWAF](https://guardianwaf.com) | Request pipeline explanations, concise technical capability groupings, installation modes |
| [AnubisWatch](https://anubis.watch) | Product-specific illustration, observability narrative, restrained status accents, differentiated section layouts |
| [CacheStorm](https://cachestorm.com) | Engine architecture, code-first quick start, clear operational constraints and FAQ |

Kervan uses its own connected-hexagon identity and gold/navy/cream palette, an original protocol/server SVG, a source-derived architecture diagram, and its own page compositions and content. The provided raster’s silhouettes are traced, including its wordmark; the original file is retained for comparison.

## Exact reference components and licenses

The CobaltDB site was inspected at revision `0b25719fef274c577ea4e3662a7e63dac2199c9c`. Its live Appearance panel was opened and the Light / Dark / System radios, preview windows, checked indicator, hints and keyboard dismissal were observed. The Kervan version adapts the original component and CSS geometry, changing the storage/event namespace and palette to Kervan.

The OXOG SVG path geometry, stroke widths and pink/purple tokens originally came from the same reference’s `oxog-mark.tsx` and `themes.css`. On 2026-10-19 the footer was aligned with the live [Mammoth Engine OXOG card](https://mammothengine.com/): the same single-card copy, oxog.net destination, 105px/65px SVG, 35px/29px/25px heading, 1100px/800px/520px breakpoints and six-second infinite `oxog-draw` cycle, with path delays of 0, 0.15, 0.3 and 0.45 seconds. The cycle draws from dash offset 400px to 0 over its first 33%, then holds. The implementation pauses when offscreen or hidden, respects reduced motion and remains independent of the mouse-effects toggle. Extra project tiles, studio signature, and website-source/GitHub bottom links were removed. The official product owner remains ECOSTACK TECHNOLOGY OÜ.

The original software license is preserved in `docs/COBALT-LICENSE.txt`. Local fonts are distributed through the official Fontsource packages with their upstream licenses retained in installed dependencies.

## Framework and tool verification

Official npm registry versions checked at implementation: Next.js 16.4.2, React/React DOM 19.3.1, TypeScript 7.0.2, lucide-react 1.59.0, Fontsource variable fonts 5.3.0, Playwright 1.64.1, Axe Playwright 4.14.0, Biome 2.5.15 and Sharp 0.35.5. Node 26.12.0 was obtained from nodejs.org; npm 12.2.0 from the official registry. A clean install, type check and production build use that runtime.

Static export follows the [official Next.js documentation](https://nextjs.org/docs/app/guides/static-exports). Deployment follows [GitHub’s custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Checkout 7.0.1, setup-node 7.1.0, configure-pages 6.0.0, upload-pages-artifact 5.0.0 and deploy-pages 5.0.1 were verified against their official GitHub releases and pinned to release SHAs.
