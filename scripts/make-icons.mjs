// Draws every icon of the project as PNG, with no dependencies.
// Usage: npm run icons
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const BG = [15, 17, 21];
const GOLD = [245, 200, 76];
const GOLD_DARK = [201, 154, 46];

// ---------- tiny PNG encoder ----------
function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) {
    let c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, pixels) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    rows.push(Buffer.from([0]), Buffer.from(pixels.subarray(y * size * 4, (y + 1) * size * 4)));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Renders shade(u, v) -> [r, g, b, a] | null over [-1, 1]², 4x4 supersampled.
function render(size, shade) {
  const px = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 4; sx++) {
          const c = shade(((x + (sx + 0.5) / 4) / size) * 2 - 1, ((y + (sy + 0.5) / 4) / size) * 2 - 1);
          if (!c) continue;
          r += c[0]; g += c[1]; b += c[2]; a += 1;
        }
      }
      const i = (y * size + x) * 4;
      if (a) px.set([r / a, g / a, b / a, (a / 16) * 255], i);
    }
  }
  return encodePng(size, px);
}

const diamond = (u, v) => Math.abs(u) + Math.abs(v);
function roundedSquare(u, v, radius) {
  const qx = Math.max(Math.abs(u) - (1 - radius), 0);
  const qy = Math.max(Math.abs(v) - (1 - radius), 0);
  return Math.hypot(qx, qy) <= radius;
}

// App icon: dark rounded square with a gold diamond.
const appIcon = (u, v) => {
  if (!roundedSquare(u, v, 0.45)) return null;
  const d = diamond(u, v);
  if (d <= 0.28) return GOLD_DARK;
  if (d <= 0.62) return GOLD;
  return BG;
};
// Tray icon: hollow diamond, single colour.
const trayIcon = (color) => (u, v) => {
  const d = diamond(u, v);
  return d <= 0.92 && d >= 0.42 ? color : null;
};

const out = (path, data) => {
  const url = new URL(`../${path}`, import.meta.url);
  mkdirSync(new URL(".", url), { recursive: true });
  writeFileSync(url, data);
};

for (const s of [16, 48, 128]) out(`app/icons/icon${s}.png`, render(s, appIcon));
// electron-builder app icon (Mac + Windows), with the margin macOS icons expect.
out("build/icon.png", render(1024, (u, v) => appIcon(u / 0.8, v / 0.8)));
// macOS: black "Template" images, auto-tinted for light / dark menu bars.
out("desktop/tray/trayTemplate.png", render(16, trayIcon([0, 0, 0])));
out("desktop/tray/trayTemplate@2x.png", render(32, trayIcon([0, 0, 0])));
// Windows: coloured icon for the notification area.
out("desktop/tray/tray-win.png", render(32, trayIcon(GOLD)));
