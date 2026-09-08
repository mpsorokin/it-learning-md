import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const publicRoot = join(root, "public");
const manifestPath = join(publicRoot, "app.webmanifest");
const indexPath = join(root, "index.html");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const index = await readFile(indexPath, "utf8");

async function pngDimensions(filePath) {
  const buffer = await readFile(filePath);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.deepEqual(buffer.subarray(0, 8), signature, `${filePath} is not a PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test("manifest declares a standalone IT Theory app", () => {
  assert.equal(manifest.id, "./");
  assert.equal(manifest.name, "IT Theory");
  assert.equal(manifest.short_name, "IT Theory");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#111210");
  assert.equal(manifest.background_color, "#111210");
  assert.deepEqual(manifest.categories, ["education", "developer-tools"]);
});

test("index links the manifest and platform icons with relative URLs", () => {
  assert.match(index, /<link rel="manifest" href="\.\/app\.webmanifest"\s*\/>/);
  assert.match(index, /<link rel="icon" href="\.\/favicon\.svg" type="image\/svg\+xml"\s*\/>/);
  assert.match(index, /<link rel="apple-touch-icon" href="\.\/icons\/apple-touch-icon-180\.png"\s*\/>/);
});

test("manifest icons include any and maskable 192px and 512px variants", async () => {
  const expected = new Map([
    ["./icons/icon-192.png", ["any", 192]],
    ["./icons/icon-512.png", ["any", 512]],
    ["./icons/icon-maskable-192.png", ["maskable", 192]],
    ["./icons/icon-maskable-512.png", ["maskable", 512]],
  ]);

  assert.equal(manifest.icons.length, expected.size);
  for (const icon of manifest.icons) {
    const [purpose, size] = expected.get(icon.src) ?? [];
    assert.ok(purpose, `unexpected manifest icon: ${icon.src}`);
    assert.equal(icon.purpose, purpose);
    assert.equal(icon.sizes, `${size}x${size}`);
    const dimensions = await pngDimensions(join(publicRoot, icon.src.slice(2)));
    assert.deepEqual(dimensions, { width: size, height: size });
  }
});

test("the Apple Touch Icon is a 180px PNG", async () => {
  const filePath = join(publicRoot, "icons", "apple-touch-icon-180.png");
  await stat(filePath);
  assert.deepEqual(await pngDimensions(filePath), { width: 180, height: 180 });
});
