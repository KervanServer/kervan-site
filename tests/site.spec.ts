import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const widths = [375, 768, 1024, 1440, 1920, 2560, 3840];
for (const width of widths)
  for (const theme of ["light", "dark"]) {
    test(`${width}px / ${theme}: all pages fit and have no runtime errors`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1080 });
      await page.addInitScript(
        (theme) => localStorage.setItem("kervan-theme", theme),
        theme,
      );
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      const failedAssets: string[] = [];
      page.on("response", (r) => {
        if (r.status() >= 400 && r.url().startsWith(new URL(page.url()).origin))
          failedAssets.push(`${r.status()} ${r.url()}`);
      });
      for (const route of [
        "/",
        "/docs/",
        "/docs/getting-started/",
        "/docs/protocols/",
        "/docs/storage/",
        "/docs/security/",
        "/docs/operations/",
        "/docs/api/",
        "/brand/",
      ]) {
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("h1")).toBeVisible();
        const overflow = await page.evaluate(() => ({
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          elements: Array.from(document.querySelectorAll("main *, footer *"))
            .filter((el) => {
              const box = el.getBoundingClientRect();
              return (
                box.right > window.innerWidth + 1 &&
                !el.closest("svg, pre, .code-block")
              );
            })
            .map((el) => ({
              tag: el.tagName,
              class: el.className,
              right: el.getBoundingClientRect().right,
            }))
            .slice(0, 15),
        }));
        expect(
          overflow.document,
          `${route}: ${JSON.stringify(overflow)}`,
        ).toBeLessThanOrEqual(overflow.viewport);
        if (route === "/" || route === "/docs/getting-started/")
          await page.screenshot({
            path: `test-results/visual/${width}-${theme}-${route === "/" ? "home" : "docs"}.png`,
            fullPage: true,
          });
        if (width >= 1920) {
          const container = await page.locator(".header-inner").boundingBox();
          expect(container?.width).toBeGreaterThanOrEqual(1680);
          expect(container?.width).toBeLessThanOrEqual(1750);
        }
      }
      expect(errors).toEqual([]);
      expect(failedAssets).toEqual([]);
    });
  }
test("Appearance matches the reference, persists, follows system and supports the keyboard", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Color theme: System" });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Appearance" })).toBeVisible();
  await expect(page.getByText("Your space, your style.")).toBeVisible();
  await page.getByRole("radio", { name: "Dark", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByText("Dark mode, just how you like it."),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Color theme: Dark" }),
  ).toBeFocused();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Color theme: Dark" }).click();
  await page.getByRole("radio", { name: "Light", exact: true }).check();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("radio", { name: "Dark", exact: true }),
  ).toBeChecked();
  await page.getByRole("radio", { name: "System", exact: true }).check();
  await page.keyboard.press("Escape");
  const light = await page
    .locator("body")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect
    .poll(() =>
      page
        .locator("body")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    )
    .not.toBe(light);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Color theme: System" }),
  ).toBeVisible();
});
test("mobile navigation, protocol tabs, installation tabs and FAQ work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Documentation" })
    .click();
  await expect(page).toHaveURL(/docs\/getting-started/);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Color theme: System" }).click();
  const panel = await page
    .getByRole("dialog", { name: "Appearance" })
    .boundingBox();
  expect(panel?.x).toBeGreaterThanOrEqual(0);
  expect((panel?.x || 0) + (panel?.width || 0)).toBeLessThanOrEqual(375);
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "FTPS", exact: false }).click();
  await expect(
    page.getByRole("tabpanel", { name: "FTPS", exact: false }),
  ).toContainText("Disabled by default");
  await page
    .getByRole("tab", { name: "FTPS", exact: false })
    .press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "SFTP", exact: false }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Docker", exact: true }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Docker", exact: true }),
  ).toContainText("ghcr.io/kervanserver/kervan:0.9.0");
  await page
    .locator("summary")
    .filter({ hasText: "Is S3 storage available today?" })
    .click();
  await expect(
    page.getByText("Yes. The current repository ships", { exact: false }),
  ).toBeVisible();
});
test("copy reports success and an unavailable clipboard clearly", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy start command" }).click();
  await expect(
    page.getByRole("button", { name: "Copied to clipboard" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "./kervan",
  );
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: () => Promise.reject(new Error("Clipboard blocked")),
    });
  });
  await page.reload();
  await page.getByRole("button", { name: "Copy start command" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Clipboard unavailable" }),
  ).toBeVisible();
});
test("themes survive unavailable storage and synchronize between tabs", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const second = await context.newPage();
  await second.goto("/");
  await page.getByRole("button", { name: "Color theme: System" }).click();
  await page.getByRole("radio", { name: "Dark", exact: true }).check();
  await expect(second.locator("html")).toHaveAttribute("data-theme", "dark");
  const blocked = await context.newPage();
  await blocked.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "getItem", {
      value() {
        throw new Error("blocked");
      },
    });
    Object.defineProperty(Storage.prototype, "setItem", {
      value() {
        throw new Error("blocked");
      },
    });
  });
  await blocked.goto("/");
  await blocked.getByRole("button", { name: "Color theme: System" }).click();
  await blocked.getByRole("radio", { name: "Light", exact: true }).check();
  await expect(blocked.locator("html")).toHaveAttribute("data-theme", "light");
});
for (const theme of ["light", "dark"])
  test(`${theme}: WCAG checks on home, docs and the open Appearance panel`, async ({
    page,
  }) => {
    await page.addInitScript(
      (theme) => localStorage.setItem("kervan-theme", theme),
      theme,
    );
    for (const route of ["/", "/docs/getting-started/", "/brand/"]) {
      await page.goto(route);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(result.violations).toEqual([]);
    }
    await page
      .getByRole("button", {
        name: `Color theme: ${theme === "light" ? "Light" : "Dark"}`,
      })
      .click();
    // Measure the settled panel, after the reference's 180ms entrance animation.
    await expect(page.getByRole("dialog", { name: "Appearance" })).toHaveCSS(
      "opacity",
      "1",
    );
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
test("reduced motion preserves the OXOG artwork and stops diagram animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const logo = page.locator(".studio-symbol");
  await logo.scrollIntoViewIfNeeded();
  await expect(logo).toBeVisible();
  expect(
    await page
      .locator(".studio-symbol path")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(
    await page
      .locator(".art-packets")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await expect(
    page.getByRole("link", { name: "Visit OXOGNET", exact: true }),
  ).toHaveAttribute("href", "https://oxog.net/");
});

test("OXOG draws its original four paths when it enters the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const mark = page.locator(".studio-symbol");
  await expect(mark).toHaveAttribute("data-motion", "waiting");
  await mark.scrollIntoViewIfNeeded();
  await expect(mark).toHaveAttribute("data-motion", "drawing");
  await expect(mark.locator("path")).toHaveCount(4);
  await expect(mark.locator("path").last()).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await page.screenshot({ path: "test-results/visual/1440-oxog-footer.png" });
});

test("the persisted theme applies before application JavaScript loads", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("kervan-theme", "dark"));
  await page.route("**/*.js", (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("h1")).toBeVisible();
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).colorScheme),
  ).toBe("dark");
});
