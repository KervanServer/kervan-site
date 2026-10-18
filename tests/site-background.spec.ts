import { expect, type Page, test } from "@playwright/test";

declare global {
  interface Window {
    backgroundProbe: { writes: number; hidden: boolean };
  }
}
async function ready(page: Page) {
  await page.addInitScript(() => {
    window.backgroundProbe = { writes: 0, hidden: false };
    const original = SVGElement.prototype.setAttribute;
    SVGElement.prototype.setAttribute = function (...args) {
      if (this.closest(".site-background")) window.backgroundProbe.writes++;
      original.apply(this, args);
    };
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => window.backgroundProbe.hidden,
    });
  });
  // Install before the app schedules its first RAF; existing native callbacks
  // cannot be advanced reliably by a clock installed after hydration.
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator(".site-background")).toHaveAttribute(
    "data-motion",
    "running",
  );
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(1600);
}
const activeWaves = (page: Page) =>
  page.locator('.field-wave:not([display="none"])');
async function blankClick(page: Page) {
  const size = page.viewportSize();
  if (!size) throw new Error("Viewport missing");
  await page.mouse.click(size.width - 20, 180);
  await page.clock.runFor(250);
}
async function expectMasked(page: Page, selector: string) {
  const result = await page
    .locator(selector)
    .first()
    .evaluate((element) => {
      const box = element.getBoundingClientRect();
      const point = {
        x: box.left + box.width / 2,
        y: box.top + Math.min(20, box.height / 2),
      };
      const covered = Array.from(
        document.querySelectorAll(".site-background mask g rect"),
      ).some(
        (rect) =>
          rect.getAttribute("display") !== "none" &&
          rect.getAttribute("opacity") !== "0.55" &&
          point.x >= Number(rect.getAttribute("x")) &&
          point.y >= Number(rect.getAttribute("y")) &&
          point.x <=
            Number(rect.getAttribute("x")) +
              Number(rect.getAttribute("width")) &&
          point.y <=
            Number(rect.getAttribute("y")) +
              Number(rect.getAttribute("height")),
      );
      return {
        covered,
        y: box.y,
        height: box.height,
        scroll: window.scrollY,
        motion: document
          .querySelector(".site-background")
          ?.getAttribute("data-motion"),
      };
    });
  expect(result.covered, JSON.stringify({ selector, ...result })).toBe(true);
}

test("one SVG spans the full site, moves through sections, protects content, and follows client navigation", async ({
  page,
}) => {
  await ready(page);
  const root = page.locator(".site-background");
  await expect(root).toHaveCount(1);
  await expect(root.locator("svg")).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(root).toHaveCSS("pointer-events", "none");
  const initial = await root
    .locator(".field-cell")
    .evaluateAll((elements) =>
      elements.map((el) => el.getAttribute("transform")),
    );
  await page.clock.runFor(700);
  expect(
    await root
      .locator(".field-cell")
      .evaluateAll((elements) =>
        elements.map((el) => el.getAttribute("transform")),
      ),
  ).not.toEqual(initial);
  await expectMasked(page, "#hero-title");
  for (const selector of ["#features", "#management", ".site-footer"]) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.clock.runFor(300);
    await expect(root).toHaveAttribute("data-motion", "running");
    const bounds = await root.boundingBox();
    expect(bounds?.y).toBe(0);
    expect(bounds?.height).toBe(page.viewportSize()?.height);
    expect(
      await root.locator('.field-cell:not([display="none"])').count(),
    ).toBeGreaterThan(5);
  }
  await page.locator(".footer-brand > p").scrollIntoViewIfNeeded();
  await page.clock.runFor(200);
  await expectMasked(page, ".footer-brand > p");
  await page.locator(".studio-card").scrollIntoViewIfNeeded();
  await page.clock.runFor(200);
  await expectMasked(page, ".studio-card");
  const element = await root.elementHandle();
  await page.getByRole("link", { name: "Quick start", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
  await expect(page.locator(".docs-article h1")).toBeInViewport();
  await page.clock.runFor(400);
  expect(await element?.evaluate((el) => el.isConnected)).toBe(true);
  await expect(root).toHaveCount(1);
  await expectMasked(page, ".docs-article h1");
  await page.getByRole("link", { name: "Brand assets", exact: true }).click();
  await expect(page).toHaveURL(/\/brand\/$/);
  await page.clock.runFor(400);
  await expectMasked(page, ".brand-preview");
  await expect(root.locator(".field-cell")).not.toHaveCount(0);
});

test("waves are finite and bounded across the page; links, buttons and text selection never emit", async ({
  page,
}) => {
  await ready(page);
  await blankClick(page);
  expect(
    await activeWaves(page).count(),
    JSON.stringify(
      await page.evaluate(() => ({
        scroll: window.scrollY,
        target: document.elementFromPoint(1260, 180)?.outerHTML.slice(0, 400),
        selection: window.getSelection()?.isCollapsed,
        motion: document
          .querySelector(".site-background")
          ?.getAttribute("data-motion"),
      })),
    ),
  ).toBeGreaterThan(0);
  await page.clock.runFor(2400);
  await expect(activeWaves(page)).toHaveCount(0);
  for (let i = 0; i < 40; i++) await page.mouse.click(1260, 140 + (i % 5) * 95);
  await page.clock.runFor(200);
  expect(await activeWaves(page).count()).toBeGreaterThan(0);
  expect(await activeWaves(page).count()).toBeLessThanOrEqual(5);
  await page.mouse.move(100, 30);
  await page.clock.runFor(2600);
  await expect(activeWaves(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Copy start command" }).click();
  const cta = page.getByRole("link", {
    name: "Start transferring",
    exact: true,
  });
  await cta.evaluate((element) =>
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    }),
  );
  await cta.click();
  const title = await page.locator("#hero-title").boundingBox();
  if (!title) throw new Error("Title missing");
  await page.mouse.move(title.x + 8, title.y + 25);
  await page.mouse.down();
  await page.mouse.move(title.x + 270, title.y + 25, { steps: 10 });
  await page.mouse.up();
  expect(
    await page.evaluate(() => window.getSelection()?.toString().length),
  ).toBeGreaterThan(3);
  await page.clock.runFor(250);
  await expect(activeWaves(page)).toHaveCount(0);
  await cta.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
  await page.clock.runFor(250);
  await expect(activeWaves(page)).toHaveCount(0);
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(800);
  await page.clock.runFor(100);
  await blankClick(page);
  expect(await activeWaves(page).count()).toBeGreaterThan(0);
});

test("culled cells stay still, hidden scenes stop, and resume discards transient effects", async ({
  page,
}) => {
  await ready(page);
  const root = page.locator(".site-background");
  const culled = await page
    .locator('.field-cell[display="none"]')
    .first()
    .elementHandle();
  expect(culled).not.toBeNull();
  const before = await culled?.evaluate((el) => el.innerHTML);
  await page.clock.runFor(1000);
  expect(await culled?.evaluate((el) => el.innerHTML)).toBe(before);
  await blankClick(page);
  expect(await activeWaves(page).count()).toBeGreaterThan(0);
  await page.evaluate(() => {
    window.backgroundProbe.hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(root).toHaveAttribute("data-motion", "paused");
  const writes = await page.evaluate(() => window.backgroundProbe.writes);
  await page.clock.runFor(20_000);
  expect(await page.evaluate(() => window.backgroundProbe.writes)).toBe(writes);
  await page.evaluate(() => {
    window.backgroundProbe.hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(200);
  await expect(root).toHaveAttribute("data-motion", "running");
  expect(
    await page.evaluate(() => window.backgroundProbe.writes),
  ).toBeGreaterThan(writes);
  await expect(activeWaves(page)).toHaveCount(0);
});

test("reduced motion is static, theme colors update without geometry changes, and preference changes work", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  const root = page.locator(".site-background");
  await expect(root).toHaveAttribute("data-motion", "reduced");
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(300);
  const cells = root.locator(".field-cell");
  const geometry = await cells.evaluateAll((elements) =>
    elements.map((el) => el.outerHTML),
  );
  const light = await cells
    .first()
    .evaluate((element) => getComputedStyle(element).color);
  await page.mouse.click(1260, 180);
  await page.clock.runFor(4000);
  expect(
    await cells.evaluateAll((elements) => elements.map((el) => el.outerHTML)),
  ).toEqual(geometry);
  await expect(activeWaves(page)).toHaveCount(0);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(cells.first()).not.toHaveCSS("color", light);
  expect(
    await cells.evaluateAll((elements) => elements.map((el) => el.outerHTML)),
  ).toEqual(geometry);
  await page.getByRole("button", { name: "Color theme: System" }).click();
  await page.getByRole("radio", { name: "Light", exact: true }).check();
  await expect(cells.first()).toHaveCSS("color", light);
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(root).toHaveAttribute("data-motion", "running");
  await page.clock.runFor(400);
  expect(
    await cells.evaluateAll((elements) => elements.map((el) => el.outerHTML)),
  ).not.toEqual(geometry);
});

test("SVG remains full-size and crisp at 4K/high-DPR while object counts stay bounded", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 3840, height: 2160 },
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  await page.goto("/");
  const root = page.locator(".site-background");
  await expect(root).toHaveAttribute("data-motion", "running");
  for (const width of [3840, 375, 1920]) {
    await page.setViewportSize({ width, height: 1080 });
    await expect(root.locator("svg")).toHaveAttribute(
      "viewBox",
      `0 0 ${width} 1080`,
    );
    expect(await root.locator(".field-cell").count()).toBeLessThanOrEqual(
      width < 768 ? 30 : 110,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(root.locator("path").first()).toHaveCSS(
      "vector-effect",
      "non-scaling-stroke",
    );
  }
  await context.close();
});

test.describe("touch", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  test("mobile taps react; native scrolling remains available and does not create waves", async ({
    page,
  }) => {
    await ready(page);
    await page.touchscreen.tap(355, 180);
    await page.clock.runFor(250);
    expect(await activeWaves(page).count()).toBeGreaterThan(0);
    await page.clock.runFor(2400);
    await expect(activeWaves(page)).toHaveCount(0);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 355, y: 600 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 355, y: 450 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.clock.runFor(300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(30);
    await expect(activeWaves(page)).toHaveCount(0);
    expect(await page.locator(".field-cell").count()).toBeLessThanOrEqual(30);
    await cdp.detach();
  });
});
