import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`OXOG reference card: ${width}px / ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript(
        (value) => localStorage.setItem("kervan-theme", value),
        theme,
      );
      await page.goto("/");
      const studio = page.locator(".studio-card");
      await studio.scrollIntoViewIfNeeded();
      await expect(studio).toHaveJSProperty("tagName", "A");
      await expect(studio).toHaveAttribute("href", "https://oxog.net");
      await expect(studio).toContainText("PART OF A BIGGER PICTURE");
      await expect(
        studio.getByRole("heading", { name: "Small studio. Big ideas." }),
      ).toBeVisible();
      await expect(studio).toContainText(
        "Explore the tools and infrastructure from Oxog.",
      );
      await expect(studio).toContainText("Meet oxog.net");
      await expect(studio.locator("a")).toHaveCount(0);
      await expect(
        page.locator(".studio-projects,.studio-signature"),
      ).toHaveCount(0);
      await expect(page.locator(".footer-bottom a")).toHaveCount(1);
      await expect(studio.locator("path")).toHaveCount(6);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      // Capture the fully drawn part of the reference's six-second loop.
      const logoPaths = studio.locator(".studio-symbol path");
      await expect(logoPaths.first()).toHaveCSS("stroke-dashoffset", "0px");
      await expect(logoPaths.last()).toHaveCSS("stroke-dashoffset", "0px");
      await page.mouse.move(0, 0);
      await page.locator(".site-footer").screenshot({
        path: `test-results/visual/${width}-${theme}-oxog-footer.png`,
      });
      await studio.focus();
      await expect(studio).toBeFocused();
      await expect(studio).toHaveCSS("outline-style", "solid");
    });
  }
}

test("OXOG loops with the reference timing independently of mouse effects and pauses outside the viewport", async ({
  page,
}) => {
  await page.goto("/");
  const mark = page.locator(".studio-symbol");
  await expect(mark).toHaveAttribute("data-motion", "paused");
  await mark.scrollIntoViewIfNeeded();
  await expect(mark).toHaveAttribute("data-motion", "running");
  const paths = mark.locator("path");
  expect(
    await paths.evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return {
          name: style.animationName,
          duration: style.animationDuration,
          delay: style.animationDelay,
          repeats: style.animationIterationCount,
        };
      }),
    ),
  ).toEqual(
    [0, 0.15, 0.3, 0.45].map((delay) => ({
      name: "oxog-draw",
      duration: "6s",
      delay: `${delay}s`,
      repeats: "infinite",
    })),
  );
  // Click the sticky control in place; locator auto-scroll can move the footer away.
  const toggle = await page.locator(".animation-toggle").boundingBox();
  expect(toggle).not.toBeNull();
  if (!toggle) throw new Error("Missing mouse-effects toggle");
  await page.mouse.click(
    toggle.x + toggle.width / 2,
    toggle.y + toggle.height / 2,
  );
  await expect(page.locator(".animation-toggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(mark).toHaveAttribute("data-motion", "running");
  await expect(paths.first()).toHaveCSS("animation-play-state", "running");
  await page.locator("h1").scrollIntoViewIfNeeded();
  await expect(mark).toHaveAttribute("data-motion", "paused");
  await expect(paths.first()).toHaveCSS("animation-play-state", "paused");
  await mark.scrollIntoViewIfNeeded();
  await expect(mark).toHaveAttribute("data-motion", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(paths.first()).toHaveCSS("animation-name", "none");
  await expect(paths.first()).toHaveCSS("stroke-dashoffset", "0px");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(mark).toHaveAttribute("data-motion", "running");
});
