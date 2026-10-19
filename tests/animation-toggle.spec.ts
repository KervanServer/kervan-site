import { expect, type Page, test } from "@playwright/test";

declare global {
  interface Window {
    animationProbe: { listeners: Record<string, number>; writes: number };
  }
}

async function ready(page: Page) {
  await page.addInitScript(() => {
    window.animationProbe = { listeners: {}, writes: 0 };
    const watched = new Set([
      "pointermove",
      "pointerdown",
      "pointerup",
      "pointercancel",
      "scroll",
      "resize",
    ]);
    const handlers = new Map<string, Set<EventListenerOrEventListenerObject>>();
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      // Exclude Playwright's non-passive hit-target interceptors.
      if (
        this === window &&
        listener &&
        watched.has(type) &&
        typeof options === "object" &&
        options.passive
      ) {
        const set = handlers.get(type) ?? new Set();
        set.add(listener);
        handlers.set(type, set);
        window.animationProbe.listeners[type] = set.size;
      }
      add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      if (this === window && listener && watched.has(type)) {
        const set = handlers.get(type);
        set?.delete(listener);
        window.animationProbe.listeners[type] = set?.size ?? 0;
      }
      remove.call(this, type, listener, options);
    };
    const attribute = SVGElement.prototype.setAttribute;
    SVGElement.prototype.setAttribute = function (...args) {
      if (this.closest(".site-background")) window.animationProbe.writes++;
      attribute.apply(this, args);
    };
  });
  await page.clock.install({ time: new Date("2026-10-18T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-19T00:00:00Z"));
  await page.goto("/");
  await expect(page.locator(".animation-toggle")).toBeVisible();
  await page.clock.runFor(300);
}

test("mouse-off keeps ambient geometry moving without responding to pointer input", async ({
  page,
}) => {
  await ready(page);
  const root = page.locator(".site-background");
  const retainedCell = await root
    .locator(".field-cell")
    .first()
    .elementHandle();
  await page.mouse.click(1260, 180);
  await page.clock.runFor(200);
  await page.locator(".animation-toggle").click();
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("data-motion", "running");
  expect(await retainedCell?.evaluate((element) => element.isConnected)).toBe(
    true,
  );
  const cells = root.locator(".field-cell");
  const before = await cells.evaluateAll((elements) =>
    elements.map((el) => el.getAttribute("transform")),
  );
  await page.mouse.move(600, 400);
  await page.mouse.click(1260, 180);
  await page.clock.runFor(2000);
  expect(
    await cells.evaluateAll((elements) =>
      elements.map((el) => el.getAttribute("transform")),
    ),
  ).not.toEqual(before);
  await expect(root.locator(".field-interaction")).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(
    root.locator(
      '.field-wave:not([display="none"]),.field-echo:not([display="none"])',
    ),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/visual/mouse-off-ambient-desktop.png",
  });
});

test("keyboard toggle clears mouse effects while ambient motion persists across navigation", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("kervan-theme", "dark"));
  await ready(page);
  const root = page.locator(".site-background");
  await expect(root).toHaveAttribute("data-motion", "running");
  const on = page.getByRole("button", {
    name: "Disable mouse effects",
    exact: true,
  });
  await expect(on).toHaveAttribute("aria-pressed", "true");
  await page.mouse.click(1260, 180);
  await page.clock.runFor(200);
  expect(
    await root.locator('.field-wave:not([display="none"])').count(),
  ).toBeGreaterThan(0);
  const active = await page.evaluate(() => ({
    ...window.animationProbe.listeners,
  }));
  expect(active.pointermove).toBeGreaterThan(0);
  expect(active.pointerdown).toBeGreaterThan(0);
  const packets = await page
    .locator(".art-packets")
    .evaluate((element) => getComputedStyle(element).animationName);
  await on.focus();
  await expect(
    page.getByRole("tooltip", { name: "Disable mouse effects" }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  const off = page.getByRole("button", {
    name: "Enable mouse effects",
    exact: true,
  });
  await expect(off).toHaveAttribute("aria-pressed", "false");
  await expect(root).toHaveAttribute("data-motion", "running");
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("data-interactive", "false");
  await expect(root.locator(".field-response")).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.animationProbe.listeners))
    .toEqual(
      Object.fromEntries(
        Object.entries(active).map(([name, count]) => [
          name,
          count - (name.startsWith("pointer") ? 1 : 0),
        ]),
      ),
    );
  const writes = await page.evaluate(() => window.animationProbe.writes);
  await page.mouse.move(600, 400);
  await page.mouse.click(1260, 180);
  await page.clock.runFor(4000);
  expect(
    await page.evaluate(() => window.animationProbe.writes),
  ).toBeGreaterThan(writes);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".art-packets")).toHaveCSS(
    "animation-name",
    packets,
  );
  expect(
    await page.evaluate(() => localStorage.getItem("kervan-animations")),
  ).toBe("off");
  await page.reload();
  await expect(off).toHaveAttribute("aria-pressed", "false");
  await expect(root).toHaveAttribute("data-motion", "running");
  await page.getByRole("link", { name: "Quick start", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
  await expect(off).toHaveAttribute("aria-pressed", "false");
  await off.focus();
  await page.keyboard.press("Enter");
  await expect(on).toHaveAttribute("aria-pressed", "true");
  await expect(root).toHaveAttribute("data-motion", "running");
  await expect
    .poll(() => page.evaluate(() => window.animationProbe.listeners))
    .toEqual(active);
  await page.clock.runFor(200);
  expect(await root.locator(".field-cell").count()).toBeGreaterThan(0);
});

test("first-use reduced motion follows the system until an explicit choice is made", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  const root = page.locator(".site-background");
  await expect(root).toHaveAttribute("data-motion", "off");
  await expect(
    page.getByRole("button", { name: "Enable mouse effects", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(
    await page.evaluate(() => localStorage.getItem("kervan-animations")),
  ).toBeNull();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(root).toHaveAttribute("data-motion", "running");
  await page
    .getByRole("button", { name: "Disable mouse effects", exact: true })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(root).toHaveAttribute("data-motion", "running");
  await expect(root).toHaveAttribute("data-interactive", "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(root).toHaveAttribute("data-motion", "off");
  await page
    .getByRole("button", { name: "Enable mouse effects", exact: true })
    .click();
  await expect(root).toHaveAttribute("data-motion", "running");
  await page.reload();
  await expect(root).toHaveAttribute("data-motion", "running");
  await page.evaluate(() =>
    localStorage.setItem("kervan-animations", "invalid"),
  );
  await page.reload();
  await expect(root).toHaveAttribute("data-motion", "off");
});

test("blocked storage keeps the control functional without runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    }),
  );
  await ready(page);
  await page
    .getByRole("button", { name: "Disable mouse effects", exact: true })
    .click();
  await expect(page.locator(".site-background")).toHaveAttribute(
    "data-interactive",
    "false",
  );
  await page
    .getByRole("button", { name: "Enable mouse effects", exact: true })
    .click();
  await expect(page.locator(".site-background")).toHaveAttribute(
    "data-motion",
    "running",
  );
  expect(errors).toEqual([]);
});

test("animation preferences synchronize between tabs and clearing the key restores system behavior", async ({
  page,
  context,
}) => {
  await ready(page);
  const other = await context.newPage();
  await other.goto("/");
  await expect(other.locator(".animation-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("button", { name: "Disable mouse effects", exact: true })
    .click();
  await expect(other.locator(".site-background")).toHaveAttribute(
    "data-interactive",
    "false",
  );
  await expect(other.locator(".site-background")).toHaveAttribute(
    "data-motion",
    "running",
  );
  await other
    .getByRole("button", { name: "Enable mouse effects", exact: true })
    .click();
  await expect(page.locator(".site-background")).toHaveAttribute(
    "data-motion",
    "running",
  );
  await other.evaluate(() => localStorage.removeItem("kervan-animations"));
  await expect(page.locator("html")).toHaveAttribute(
    "data-animation-preference",
    "system",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".site-background")).toHaveAttribute(
    "data-motion",
    "off",
  );
  await other.close();
});

test.describe("touch control", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  test("mouse control is touch-sized and fits narrow headers in both states", async ({
    page,
  }) => {
    await ready(page);
    const control = page.locator(".animation-toggle");
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await control.tap();
    await expect(control).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".site-background")).toHaveAttribute(
      "data-motion",
      "running",
    );
    await page.screenshot({
      path: "test-results/visual/mouse-off-ambient-mobile.png",
    });
    await control.tap();
    await expect(control).toHaveAttribute("aria-pressed", "true");
    for (const width of [320, 375, 768]) {
      await page.setViewportSize({ width, height: 812 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
  });
});
