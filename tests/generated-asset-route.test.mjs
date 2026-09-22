import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import * as imageUtils from "../src/lib/workflow-utils.mjs";
import { resolveGeneratedAssetPath } from "../src/lib/workflow-utils.mjs";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

test("resolveGeneratedAssetPath successfully locates existing generated files", () => {
  const testDir = path.join(process.cwd(), "public", "generated", "workflow");
  fs.mkdirSync(testDir, { recursive: true });
  const testFilename = `test-asset-${Date.now()}.png`;
  const testFilePath = path.join(testDir, testFilename);
  fs.writeFileSync(testFilePath, png);

  try {
    const resolved = resolveGeneratedAssetPath(["workflow", testFilename]);
    assert.ok(resolved, "Should find the created test file");
    assert.equal(path.resolve(resolved), path.resolve(testFilePath));
  } finally {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
});

test("resolveGeneratedAssetPath blocks directory traversal attacks with null", () => {
  const resolved = resolveGeneratedAssetPath(["..", "..", "etc", "passwd"]);
  assert.equal(resolved, null, "Traversal attacks must be rejected");

  const resolvedDot = resolveGeneratedAssetPath(["workflow", "..", "package.json"]);
  assert.equal(resolvedDot, null, "Relative dot segments must be rejected");
});

test("resolveGeneratedAssetPath returns null for nonexistent files", () => {
  const resolved = resolveGeneratedAssetPath(["workflow", "nonexistent-image-12345.png"]);
  assert.equal(resolved, null, "Nonexistent file must return null");
});

test("generated route serves only validated raster content with immutable and nosniff headers", async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "generated-route-test-"));
  const priorDirectory = process.env.GENERATED_ASSET_DIR;
  process.env.GENERATED_ASSET_DIR = directory;
  t.after(() => {
    if (priorDirectory === undefined) delete process.env.GENERATED_ASSET_DIR;
    else process.env.GENERATED_ASSET_DIR = priorDirectory;
    fs.rmSync(directory, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(directory, "workflow"));
  fs.writeFileSync(path.join(directory, "workflow", "actual.png"), png);
  fs.writeFileSync(path.join(directory, "workflow", "forged.png"), "<svg onload='bad'>");
  fs.writeFileSync(path.join(directory, "workflow", "forged.jpg"), png);
  const source = fs.readFileSync(new URL("../src/app/generated/[...path]/route.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const require = createRequire(import.meta.url);
  const routeModule = { exports: {} };
  vm.runInNewContext(compiled, { module: routeModule, exports: routeModule.exports, require: name => name === "@/lib/workflow-utils.mjs" ? imageUtils : require(name), console, Buffer });
  const get = filename => routeModule.exports.GET(new Request("https://example.com/generated/workflow/" + filename), { params: Promise.resolve({ path: ["workflow", filename] }) });
  const valid = await get("actual.png");
  assert.equal(valid.status, 200);
  assert.equal(valid.headers.get("content-type"), "image/png");
  assert.equal(valid.headers.get("x-content-type-options"), "nosniff");
  assert.equal(valid.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.deepEqual(Buffer.from(await valid.arrayBuffer()), png);
  assert.equal((await get("forged.png")).status, 415);
  assert.equal((await get("forged.jpg")).status, 415);
  assert.equal((await get("missing.png")).status, 404);
  assert.equal((await get("../package.json")).status, 404);
});

test("generated path resolver rejects symlinked workflow directories escaping storage", t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "generated-boundary-test-"));
  const root = path.join(directory, "generated");
  const outside = path.join(directory, "private");
  fs.mkdirSync(root);
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, "private.png"), png);
  const priorDirectory = process.env.GENERATED_ASSET_DIR;
  process.env.GENERATED_ASSET_DIR = root;
  t.after(() => {
    if (priorDirectory === undefined) delete process.env.GENERATED_ASSET_DIR;
    else process.env.GENERATED_ASSET_DIR = priorDirectory;
    fs.rmSync(directory, { recursive: true, force: true });
  });
  try {
    fs.symlinkSync(outside, path.join(root, "workflow"), "junction");
  } catch (error) {
    if (error.code === "EPERM") return t.skip("This host does not allow test symlinks");
    throw error;
  }
  assert.equal(resolveGeneratedAssetPath(["workflow", "private.png"]), null);
});
