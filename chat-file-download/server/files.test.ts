import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { findReferencedFiles } from "./files.ts";

test("finds absolute, relative and bare file names that exist, skips the rest", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cfd-"));
  await writeFile(join(dir, "report.csv"), "a,b");
  await writeFile(join(dir, "package.json"), "{}");
  const text = `Wrote ${dir}/report.csv. See package.json (v0.11.4) and src/missing.ts, e.g. https://x.io/a.txt.`;
  const files = await findReferencedFiles(text, dir);
  assert.deepEqual(
    files.map((file) => [file.path, file.label]),
    [
      [`${dir}/report.csv`, "report.csv"],
      [`${dir}/package.json`, "package.json"],
    ],
  );
  assert.deepEqual(await findReferencedFiles("/tmp/not-here-123.txt", dir), []);
});
