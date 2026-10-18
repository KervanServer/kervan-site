import { expect, type Page, test } from "@playwright/test";

declare global {
  interface Window {
    heroProbe: {
      paints: number;
      effects: number;
      effectFrames: number;
      gold: string;
      hidden: boolean;
    };
  }
}

/** Observe actual Canvas drawing, without exposing a production-only test API. */
async function installProbe(page: Page) {
  await page.addInitScript(() => {
    window.heroProbe = {
      paints: 0,
      effects: 0,
      effectFrames: 0,
      gold: "",
      hidden: false,
    };
    const prototype = CanvasRenderingContext2D.prototype;
    const paths = new WeakMap<
      CanvasRenderingContext2D,
      {
        vertices: number;
        curved: boolean;
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
      }
    >();
    const isHero = (ctx: CanvasRenderingContext2D) =>
      ctx.canvas.classList.contains("hero-backdrop");
    const begin = prototype.beginPath;
    prototype.beginPath = function () {
      if (isHero(this))
        paths.set(this, {
          vertices: 0,
          curved: false,
          minX: Infinity,
          maxX: -Infinity,
          minY: Infinity,
          maxY: -Infinity,
        });
      begin.call(this);
    };
    const line = prototype.lineTo;
    prototype.lineTo = function (x, y) {
      const path = paths.get(this);
      if (path) {
        path.vertices++;
        path.minX = Math.min(path.minX, x);
        path.maxX = Math.max(path.maxX, x);
        path.minY = Math.min(path.minY, y);
        path.maxY = Math.max(path.maxY, y);
      }
      line.call(this, x, y);
    };
    const arc = prototype.arc;
    prototype.arc = function (...args) {
      const path = paths.get(this);
      if (path) path.curved = true;
      arc.apply(this, args);
    };
    const clear = prototype.clearRect;
    prototype.clearRect = function (...args) {
      if (isHero(this)) {
        window.heroProbe.paints++;
        window.heroProbe.effects = 0;
      }
      clear.apply(this, args);
    };
    const stroke = prototype.stroke;
    prototype.stroke = function (...args: [Path2D?]) {
      if (isHero(this)) {
        const path = paths.get(this);
        if (typeof this.strokeStyle === "string")
          window.heroProbe.gold = this.strokeStyle;
        if (
          path &&
          (path.curved ||
            (path.vertices >= 5 &&
              path.maxX - path.minX > 70 &&
              path.maxY - path.minY > 70))
        ) {
          window.heroProbe.effects++;
          window.heroProbe.effectFrames++;
        }
      }
      if (args[0]) stroke.call(this, args[0]);
      else Reflect.apply(stroke, this, []);
    };
    // Visibility's public event boundary is exercised with a deterministic browser state.
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => window.heroProbe.hidden,
    });
  });
}

async function ready(page: Page) {
  await installProbe(page);
  await page.goto("/");
  await expect(page.locator(".hero-backdrop")).toHaveAttribute(
    "data-motion",
    "running",
  );
  await page.evaluate(() => document.fonts.ready);
  await page.clock.install();
  await page.clock.runFor(1800);
}

test("ambient canvas moves; blank clicks draw finite waves, controls and text never do", async ({
  page,
}) => {
  await ready(page);
  const canvas = page.locator(".hero-backdrop");
  const before = await canvas.evaluate((element: HTMLCanvasElement) =>
    element.toDataURL(),
  );
  await page.clock.runFor(500);
  expect(
    await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()),
  ).not.toBe(before);
  const stage = await page.locator(".hero-stage").boundingBox();
  if (!stage) throw new Error("Hero bounds missing");
  await page.mouse.click(stage.width - 150, stage.y + 130);
  await page.clock.runFor(250);
  expect(await page.evaluate(() => window.heroProbe.effects)).toBeGreaterThan(
    0,
  );
  await page.mouse.move(600, 20);
  await page.clock.runFor(2200);
  expect(await page.evaluate(() => window.heroProbe.effects)).toBe(0);
  for (let i = 0; i < 40; i++)
    await page.mouse.click(850 + (i % 3) * 100, stage.y + 90 + (i % 4) * 120);
  await page.clock.runFor(250);
  const rapid = await page.evaluate(() => window.heroProbe.effects);
  expect(rapid).toBeGreaterThan(0);
  expect(rapid).toBeLessThanOrEqual(12);
  await page.clock.runFor(2200);
  expect(await page.evaluate(() => window.heroProbe.effects)).toBe(0);
  const count = await page.evaluate(() => window.heroProbe.effectFrames);
  await page.getByRole("button", { name: "Copy start command" }).click();
  await page.clock.runFor(250);
  await page.locator("#hero-title").click();
  await page.clock.runFor(250);
  expect(await page.evaluate(() => window.heroProbe.effectFrames)).toBe(count);
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
  await page.clock.runFor(250);
  expect(await page.evaluate(() => window.heroProbe.effectFrames)).toBe(count);
  await cta.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
  const afterUnmount = await page.evaluate(() => window.heroProbe.paints);
  await page.clock.runFor(1200);
  expect(await page.evaluate(() => window.heroProbe.paints)).toBe(afterUnmount);
  expect(await page.evaluate(() => window.heroProbe.effectFrames)).toBe(count);
});

test("dragging and selecting content never become a background tap", async ({
  page,
}) => {
  await ready(page);
  const box = await page.locator("#hero-title").boundingBox();
  if (!box) throw new Error("Title missing");
  await page.mouse.move(box.x + 8, box.y + 25);
  await page.mouse.down();
  await page.mouse.move(box.x + 270, box.y + 25, { steps: 15 });
  await page.mouse.up();
  expect(
    await page.evaluate(() => window.getSelection()?.toString().length),
  ).toBeGreaterThan(3);
  await page.clock.runFor(250);
  expect(await page.evaluate(() => window.heroProbe.effectFrames)).toBe(0);
  await page.mouse.click(1100, 180);
  await page.clock.runFor(250);
  expect(await page.evaluate(() => window.heroProbe.effects)).toBeGreaterThan(
    0,
  );
  await page.clock.runFor(2200);
  const count = await page.evaluate(() => window.heroProbe.effectFrames);
  await page.mouse.move(1100, 180);
  await page.mouse.down();
  await page.mouse.move(1100, 240);
  await page.mouse.move(1100, 180);
  await page.mouse.up();
  await page.clock.runFor(300);
  expect(await page.evaluate(() => window.heroProbe.effectFrames)).toBe(count);
});

test("offscreen and hidden scenes stop painting, then resume without an accumulated burst", async ({
  page,
}) => {
  await ready(page);
  const canvas = page.locator(".hero-backdrop");
  await page.locator("#management").scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-motion", "paused");
  const offscreen = await page.evaluate(() => window.heroProbe.paints);
  await page.clock.runFor(20_000);
  expect(await page.evaluate(() => window.heroProbe.paints)).toBe(offscreen);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(canvas).toHaveAttribute("data-motion", "running");
  await page.clock.runFor(100);
  expect(await page.evaluate(() => window.heroProbe.paints)).toBeGreaterThan(
    offscreen,
  );
  await page.evaluate(() => {
    window.heroProbe.hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(canvas).toHaveAttribute("data-motion", "paused");
  const hidden = await page.evaluate(() => window.heroProbe.paints);
  await page.clock.runFor(20_000);
  expect(await page.evaluate(() => window.heroProbe.paints)).toBe(hidden);
  await page.evaluate(() => {
    window.heroProbe.hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(100);
  await expect(canvas).toHaveAttribute("data-motion", "running");
  expect(await page.evaluate(() => window.heroProbe.paints)).toBeGreaterThan(
    hidden,
  );
  expect(await page.evaluate(() => window.heroProbe.effects)).toBe(0);
});

test("reduced motion stays still, paints both palettes, and responds to runtime preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await installProbe(page);
  await page.goto("/");
  const canvas = page.locator(".hero-backdrop");
  await expect(canvas).toHaveAttribute("data-motion", "reduced");
  await page.evaluate(() => document.fonts.ready);
  await page.clock.install();
  await page.clock.runFor(300);
  const light = await canvas.evaluate((element: HTMLCanvasElement) =>
    element.toDataURL(),
  );
  const count = await page.evaluate(() => window.heroProbe.paints);
  await page.mouse.click(1100, 180);
  await page.clock.runFor(4000);
  expect(await page.evaluate(() => window.heroProbe.paints)).toBe(count);
  expect(
    await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()),
  ).toBe(light);
  expect(await page.evaluate(() => window.heroProbe.gold)).toBe("#987020");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect
    .poll(() => page.evaluate(() => window.heroProbe.gold))
    .toBe("#dfb85f");
  expect(
    await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()),
  ).not.toBe(light);
  await page.getByRole("button", { name: "Color theme: System" }).click();
  await page.getByRole("radio", { name: "Light", exact: true }).check();
  await expect
    .poll(() => page.evaluate(() => window.heroProbe.gold))
    .toBe("#987020");
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(canvas).toHaveAttribute("data-motion", "running");
  const resume = await page.evaluate(() => window.heroProbe.paints);
  await page.clock.runFor(300);
  expect(await page.evaluate(() => window.heroProbe.paints)).toBeGreaterThan(
    resume,
  );
});

test("4K coverage and high-DPR resize obey the render-pixel budget", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 3840, height: 2160 },
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  await page.goto("/");
  const canvas = page.locator(".hero-backdrop");
  await expect(canvas).toHaveAttribute("data-motion", "running");
  for (const width of [3840, 375, 1920]) {
    await page.setViewportSize({ width, height: 1080 });
    await expect
      .poll(() =>
        canvas.evaluate((element: HTMLCanvasElement) =>
          Math.round(element.getBoundingClientRect().width),
        ),
      )
      .toBe(width);
    // ResizeObserver updates the backing bitmap on the next rendering turn.
    await expect
      .poll(() =>
        canvas.evaluate((element: HTMLCanvasElement) => {
          const cssWidth = element.getBoundingClientRect().width;
          return element.width >= cssWidth && element.width / cssWidth <= 1.75;
        }),
      )
      .toBe(true);
    const bounds = await canvas.evaluate((element: HTMLCanvasElement) => ({
      width: element.width,
      height: element.height,
      css: element.getBoundingClientRect().width,
    }));
    expect(bounds.width * bounds.height).toBeLessThanOrEqual(4_000_000);
    expect(bounds.width).toBeGreaterThanOrEqual(bounds.css);
    expect(bounds.width / bounds.css).toBeLessThanOrEqual(1.75);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }
  await context.close();
});

test.describe("touch", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  test("taps react; native swipes scroll without producing waves", async ({
    page,
  }) => {
    await ready(page);
    await page.touchscreen.tap(355, 155);
    await page.clock.runFor(250);
    expect(await page.evaluate(() => window.heroProbe.effects)).toBeGreaterThan(
      0,
    );
    await page.clock.runFor(2200);
    const count = await page.evaluate(() => window.heroProbe.effectFrames);
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
    expect(await page.evaluate(() => window.heroProbe.effectFrames)).toBe(
      count,
    );
    expect(await page.evaluate(() => window.heroProbe.effects)).toBe(0);
    await cdp.detach();
  });
});
