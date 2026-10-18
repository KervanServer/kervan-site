import { expect, type Page, test } from "@playwright/test";
import sharp from "sharp";

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
  await page.clock.install({ time: new Date("2026-10-18T00:00:00Z") });
  // Freeze before navigation: no app RAF exists yet, and no Date.now/CDP race.
  await page.clock.pauseAt(new Date("2026-10-19T00:00:00Z"));
  await page.goto("/");
  // Native compositor scroll animations use a different clock from JS timers.
  // These tests measure scene lifetimes and masks, so settle navigation instantly.
  await page.addStyleTag({
    content: "html { scroll-behavior: auto !important; }",
  });
  await expect(page.locator(".site-background")).toHaveAttribute(
    "data-motion",
    "running",
  );
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(1600);
}
const activeWaves = (page: Page) =>
  page.locator('.field-wave:not([display="none"])');

test("fluid cursor shapes relay finite click echoes above readable content", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await ready(page);
  const title = await page.locator("#hero-title").boundingBox();
  if (!title) throw new Error("Title missing");
  const x = title.x + title.width * 0.6;
  const y = title.y + 50;
  await page.mouse.move(x, y);
  await page.clock.runFor(700);
  const motes = page.locator(".field-mote");
  const before = await motes.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("transform")),
  );
  await page.clock.runFor(500);
  expect(
    await motes.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("transform")),
    ),
  ).not.toEqual(before);
  await page.mouse.click(x, y);
  const echoes = page.locator('.field-echo:not([display="none"])');
  const centers = new Set<string>();
  let captured = false;
  for (let index = 0; index < 14; index++) {
    await page.clock.runFor(100);
    const transforms = await echoes.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("transform") ?? ""),
    );
    for (const transform of transforms) centers.add(transform);
    expect(transforms.length).toBeLessThanOrEqual(8);
    if (!captured && transforms.length > 1) {
      await page.screenshot({
        path: "test-results/visual/organic-flow-dark.png",
      });
      captured = true;
    }
  }
  expect(centers.size).toBeGreaterThan(2);
  expect(captured).toBe(true);
  await page.clock.runFor(5000);
  await expect(echoes).toHaveCount(0);
  await expect(activeWaves(page)).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.click(x, y);
  await page.clock.runFor(1000);
  await expect(echoes).toHaveCount(0);
  await expect(page.locator(".field-interaction")).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(page.locator(".site-background")).toHaveAttribute(
    "data-motion",
    "off",
  );
});

test("pointer response crosses text, cards and section boundaries without rectangular masks", async ({
  page,
}) => {
  await ready(page);
  await expect(page.locator(".site-background")).toHaveCSS(
    "pointer-events",
    "none",
  );
  expect(
    await page
      .locator(".field-wave")
      .first()
      .evaluate((element) => {
        let current: Element | null = element;
        while (current) {
          if (current.getAttribute("mask")) return true;
          current = current.parentElement;
        }
        return false;
      }),
  ).toBe(false);
  for (const selector of [
    "#hero-title",
    ".feature-featured",
    "#management h2",
    ".cta-section h2",
    ".cta-section a",
    ".site-header a",
  ]) {
    const target = page.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) throw new Error(`Missing target: ${selector}`);
    const point = {
      x: box.x + box.width / 2,
      y: box.y + Math.min(30, box.height / 2),
    };
    await page.mouse.move(point.x, point.y);
    await page.clock.runFor(300);
    const reaction = page.locator(".field-interaction");
    await expect(reaction).toHaveAttribute("data-active", "true");
    const layer = await reaction.evaluate((element) => {
      let current: Element | null = element;
      const masks: string[] = [];
      while (current && !current.matches("body")) {
        const style = getComputedStyle(current);
        if (current.getAttribute("mask") || style.maskImage !== "none")
          masks.push(current.tagName);
        current = current.parentElement;
      }
      return {
        masks,
        hit:
          document
            .elementFromPoint(
              Number(element.getAttribute("data-x")),
              Number(element.getAttribute("data-y")),
            )
            ?.closest(".site-background") != null,
      };
    });
    expect(layer.masks).toEqual([]);
    expect(layer.hit).toBe(false);
    await expect(reaction).toHaveAttribute("data-x", point.x.toFixed(2));
    await expect(reaction).toHaveAttribute("data-y", point.y.toFixed(2));
  }
});

test("scroll preserves the viewport cursor and emits a click wave at the current client coordinates", async ({
  page,
}) => {
  await ready(page);
  const x = 900;
  const y = 380;
  await page.mouse.move(x, y);
  await page.clock.runFor(500);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.addEventListener("scroll", () => resolve(), { once: true });
        window.scrollTo({ top: 950, behavior: "instant" });
      }),
  );
  await page.clock.runFor(500);
  const cursor = page.locator(".field-cursor");
  expect(Number(await cursor.getAttribute("opacity"))).toBeGreaterThan(0.9);
  const point = await cursor.evaluate((element) => {
    const matrix = (element as SVGGraphicsElement).getCTM();
    return { x: matrix?.e ?? 0, y: matrix?.f ?? 0 };
  });
  expect(point.x).toBeCloseTo(x, 0);
  expect(point.y).toBeCloseTo(y, 0);
  const target = page.locator("#features .feature-featured").first();
  await target.scrollIntoViewIfNeeded();
  await target.evaluate((element) =>
    element.addEventListener("pointermove", (event) => event.stopPropagation()),
  );
  await target.evaluate((element) =>
    element.addEventListener(
      "pointerup",
      (event) => {
        element.setAttribute(
          "data-client-x",
          String((event as PointerEvent).clientX),
        );
        element.setAttribute(
          "data-client-y",
          String((event as PointerEvent).clientY),
        );
      },
      { once: true },
    ),
  );
  await target.click({ position: { x: 40, y: 40 } });
  await page.clock.runFor(200);
  await expect(page.locator(".field-interaction")).toHaveAttribute(
    "data-active",
    "true",
  );
  const wave = activeWaves(page).last();
  await expect(wave).toHaveAttribute(
    "transform",
    `translate(${Number(await target.getAttribute("data-client-x")).toFixed(2)} ${Number(await target.getAttribute("data-client-y")).toFixed(2)})`,
  );
});

for (const theme of ["light", "dark"] as const) {
  test(`${theme}: response is visibly composited over text, cards and a section boundary`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ colorScheme: theme });
    await ready(page);
    for (const [name, selector, boundary] of [
      ["text", "#hero-title", false],
      ["card", ".feature-featured", false],
      ["boundary", ".cta-section", true],
    ] as const) {
      const target = page.locator(selector).first();
      await target.scrollIntoViewIfNeeded();
      if (boundary) {
        await target.evaluate((element) =>
          window.scrollTo({
            top: element.getBoundingClientRect().top + window.scrollY - 450,
            behavior: "instant",
          }),
        );
      }
      await page.clock.runFor(200);
      const box = await target.boundingBox();
      if (!box) throw new Error(`Missing ${selector}`);
      const x = box.x + box.width / 2;
      const y = boundary ? box.y : box.y + Math.min(80, box.height / 2);
      await page.mouse.move(x - 90, y - 30);
      await page.clock.runFor(100);
      await page.mouse.move(x, y, { steps: 8 });
      await page.clock.runFor(200);
      const clip = {
        x: Math.max(0, Math.min(x - 180, 1080)),
        y: Math.max(0, Math.min(y - 160, 680)),
        width: 360,
        height: 320,
      };
      const visible = await page.screenshot({ clip });
      const style = await page.addStyleTag({
        content: ".field-response { visibility: hidden !important; }",
      });
      const hidden = await page.screenshot({ clip });
      await style.evaluate((element) =>
        element.parentNode?.removeChild(element),
      );
      const a = await sharp(visible).removeAlpha().raw().toBuffer();
      const b = await sharp(hidden).removeAlpha().raw().toBuffer();
      let changed = 0;
      for (let index = 0; index < a.length; index += 3) {
        if (
          Math.max(
            Math.abs(a[index] - b[index]),
            Math.abs(a[index + 1] - b[index + 1]),
            Math.abs(a[index + 2] - b[index + 2]),
          ) > 2
        )
          changed++;
      }
      expect(
        changed,
        `${theme}/${name}: actual visible effect pixels`,
      ).toBeGreaterThan(250);
      await page.screenshot({
        path: `test-results/visual/interaction-${theme}-${name}.png`,
      });
    }
  });
}
async function blankClick(page: Page) {
  const size = page.viewportSize();
  if (!size) throw new Error("Viewport missing");
  await page.mouse.click(size.width - 20, 180);
  await page.clock.runFor(250);
}
async function expectMasked(page: Page, selector: string) {
  await expect
    .poll(async () => {
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
      return result.covered || { selector, ...result };
    })
    .toBe(true);
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
  await page.locator(".brand-preview").first().scrollIntoViewIfNeeded();
  await expect(page.locator(".brand-preview").first()).toBeInViewport();
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
  await expect(page.locator(".docs-article h1")).toBeInViewport();
  await page.clock.runFor(250);
  await expect(activeWaves(page)).toHaveCount(0);
  // Scroll events are delivered by the native renderer, outside the JS clock.
  // Wait for that event before starting a separate user tap.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        if (window.scrollY === 800) {
          resolve();
          return;
        }
        window.addEventListener("scroll", () => resolve(), { once: true });
        window.scrollTo({ top: 800, behavior: "instant" });
      }),
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(800);
  await page.clock.runFor(100);
  await blankClick(page);
  expect(
    await activeWaves(page).count(),
    JSON.stringify(
      await page.evaluate(() => ({
        scroll: window.scrollY,
        target: document.elementFromPoint(1260, 180)?.outerHTML.slice(0, 300),
        selection: window.getSelection()?.isCollapsed,
        selectionText: window.getSelection()?.toString(),
        motion: document
          .querySelector(".site-background")
          ?.getAttribute("data-motion"),
      })),
    ),
  ).toBeGreaterThan(0);
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

test("theme colors update without geometry changes and system motion preferences stop and restart the field", async ({
  page,
}) => {
  await page.emulateMedia({
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  await ready(page);
  const root = page.locator(".site-background");
  const cells = root.locator(".field-cell");
  const geometry = await cells.evaluateAll((elements) =>
    elements.map((el) => el.outerHTML),
  );
  const light = await cells
    .first()
    .evaluate((element) => getComputedStyle(element).color);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(cells.first()).not.toHaveCSS("color", light);
  expect(
    await cells.evaluateAll((elements) => elements.map((el) => el.outerHTML)),
  ).toEqual(geometry);
  await page.getByRole("button", { name: "Color theme: System" }).click();
  await page.getByRole("radio", { name: "Light", exact: true }).check();
  await expect(cells.first()).toHaveCSS("color", light);
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(root).toHaveAttribute("data-motion", "off");
  await expect(cells).toHaveCount(0);
  await page.mouse.click(1260, 180);
  await page.clock.runFor(4000);
  await expect(activeWaves(page)).toHaveCount(0);
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
