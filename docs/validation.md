# Validation evidence

October 18, 2026. Local implementation verified on Windows with Node 26.12.0 and npm 12.2.0.

## Local result

- Clean `npm ci`: successful, 0 reported dependency vulnerabilities.
- `npm run check`: 36 files checked, no diagnostics.
- `npm run typecheck`: Next.js route types generated; TypeScript successful.
- `npm run build`: successful; all routes statically generated.
- Export validator: 12 HTML files; required routes, local links, assets, CNAME and .nojekyll verified.
- `npm test`: **23 passed, 0 failed, 0 skipped** (1.1 minutes).

The browser matrix covers all nine user-facing pages at 375, 768, 1024, 1440, 1920, 2560 and 3840px, in light and dark themes. It checks no horizontal document overflow, successful route responses, no missing local assets, no browser runtime errors and no error-level console messages. At 1920px and larger, header container width is verified to remain between 1680 and 1750px.

Behavioral tests cover the reference Appearance panel, radio/keyboard controls, local persistence, system appearance changes, multi-tab updates, storage denial, mobile navigation, protocol/install tabs, FAQ, clipboard success and failure, and pre-hydration theme bootstrap. Axe reports no WCAG A/AA violations on the home page, getting-started guide, brand page and settled Appearance panel in either theme. OXOG's original four paths are verified to draw when scrolled into view, and remain visible without animation under reduced motion.

Visual captures under `test-results/visual/` were inspected, including desktop and mobile heroes, responsive guide layouts and the OXOG footer. These generated files are deliberately untracked.

## Issues caught and repaired during verification

1. Next.js on Windows nested RSC segment filenames that the browser requests as flat names. Export normalization fixes the artifact itself; the static preview server performs no framework rewrites.
2. A grid child let a long code line expand the 375px document. Grid child minimum widths now allow the code panel to scroll internally.
3. Protocol index opacity reduced text contrast. Full-contrast text now passes in both themes.
4. A decorative tagline inside the logo link caused an accessible-name mismatch. It is now adjacent to the link.

The final browser suite retains checks for the first two failures and the accessibility cases. The Appearance panel contrast scan waits for its original entrance animation to finish, so it measures the settled UI.

## Real product command check

The published Windows v0.9.0 release archive was downloaded from KervanServer/kervan. Its SHA-256 matched the published checksum:

`d4210f6bff1be0ff3dffb569ae1d1b3221301191190a2534681e11d9c090a517`

In a separate disposable working directory, the released binary successfully ran `version`, `init`, `admin create` and `check`. It reported version 0.9.0, created the config and admin, and confirmed FTP/SFTP/SCP/WebUI enabled. No product server was left running.

## External checks and publication

The requested seven design references, OXOG home/ecosystem/project links and upstream license/contributor/API references returned HTTP 200. The domain already resolved to GitHub Pages A and AAAA addresses. GitHub Pages is configured for Actions, custom domain `kervanserver.com`, and HTTPS enforcement; GitHub reported the certificate approved.

Hosted workflow status and deployed behavior must additionally be checked after pushing. Local verification alone does not establish a successful deployment.
