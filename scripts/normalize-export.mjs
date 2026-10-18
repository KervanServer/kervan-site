import { copyFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

// Next.js Windows static exports may nest RSC segment files that browsers
// request with dot-separated names. Normalize the published artifact too,
// rather than masking the discrepancy in the preview server. Linux is a no-op.
async function normalize(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = join(directory, entry.name);
    if (!entry.name.startsWith("__next.")) {
      await normalize(child);
      continue;
    }
    for (const file of await readdir(child, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (!file.isFile() || !file.name.endsWith(".txt")) continue;
      const source = join(file.parentPath, file.name);
      const name = `${entry.name}.${relative(child, source).replaceAll(/[/\\]/g, ".")}`;
      await copyFile(source, join(directory, name));
    }
  }
}
await normalize("out");
console.log(
  "Normalized static RSC segment filenames for Windows/Linux parity.",
);
