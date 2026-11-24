// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const MAIN = fileURLToPath(new URL("./main.ts", import.meta.url));

function run(dir: string): string {
  execFileSync(process.execPath, [MAIN, dir], { stdio: "pipe" });
  const outPath = join(dir, "entry.txt");
  assert.ok(existsSync(outPath), `entry.txt was not written to ${outPath}`);
  return readFileSync(outPath, "utf8");
}

test("main.ts writes one deterministic single line to <dir>/entry.txt", (t) => {
  const d1 = mkdtempSync(join(tmpdir(), "rmh-a-"));
  const d2 = mkdtempSync(join(tmpdir(), "rmh-b-"));
  t.after(() => {
    rmSync(d1, { recursive: true, force: true });
    rmSync(d2, { recursive: true, force: true });
  });

  const a = run(d1);
  const b = run(d2);

  assert.equal(a, b, "output differs between runs");
  assert.ok(a.length > 0, "output is empty");
  assert.ok(a.trim().length > 0, "output is only whitespace");
  assert.ok(!/[\r\n]/.test(a), "output must be exactly one line, no newline");
  const chars = [...a].length;
  assert.ok(chars <= 200, `output is ${chars} characters, over the 200 limit`);
});
