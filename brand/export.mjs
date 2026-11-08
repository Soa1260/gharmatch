// Regenerates the PNG logo files from src/app/icon.svg. Run: node brand/export.mjs
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const tile = readFileSync("src/app/icon.svg");

const outputs = [
  ["src/app/apple-icon.png", 180], // iPhone home screen. Next.js serves it automatically.
  ["brand/icon-512.png", 512],
  ["brand/icon-1024.png", 1024],
  ["brand/icon-32.png", 32],
];
for (const [file, size] of outputs) {
  await sharp(tile, { density: 384 }).resize(size, size).png().toFile(file);
  console.log("wrote", file, size);
}

// Transparent house-only mark on a dark tile is the app icon; this one is for light or dark backgrounds.
const mark = readFileSync("brand/mark.svg");
await sharp(mark, { density: 384 }).resize(1024, 1024).png().toFile("brand/mark-1024.png");
console.log("wrote brand/mark-1024.png");

// A contact sheet so the icon can be judged at the sizes people actually see it.
const sizes = [16, 24, 32, 48, 64, 128];
const bg = { r: 244, g: 239, b: 230 };
const dark = { r: 10, g: 12, b: 16 };
const layers = [];
let x = 40;
for (const s of sizes) {
  layers.push({ input: await sharp(tile, { density: 384 }).resize(s, s).png().toBuffer(), left: x, top: 60 + (128 - s) / 2 });
  layers.push({ input: await sharp(tile, { density: 384 }).resize(s, s).png().toBuffer(), left: x, top: 280 + (128 - s) / 2 });
  x += s + 40;
}
const sheetW = x + 20;
const sheet = sharp({ create: { width: sheetW, height: 440, channels: 3, background: bg } });
const darkBand = await sharp({ create: { width: sheetW, height: 220, channels: 3, background: dark } }).png().toBuffer();
writeFileSync("brand/sizes.png", await sheet.composite([{ input: darkBand, left: 0, top: 220 }, ...layers]).png().toBuffer());
console.log("wrote brand/sizes.png");
