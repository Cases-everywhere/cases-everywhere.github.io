// Renders the Chrome Web Store promo images from store/promo.html with headless Chrome.
// Usage: npm run promo
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const BROWSERS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
];
const SIZES = [
  ["promo-small.png", 440, 280],     // required "small promo tile"
  ["promo-marquee.png", 1400, 560],  // optional "marquee promo tile"
];
const PORT = 9335;

const browser = BROWSERS.find(existsSync);
if (!browser) throw new Error("Chrome or Brave not found");
const profile = mkdtempSync(path.join(tmpdir(), "promo-"));
const chrome = spawn(browser, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--hide-scrollbars", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let targets;
  for (let i = 0; i < 40 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); }
  }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let seq = 0;
  const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); pending.get(d.id)?.(d.result); };
  const send = (method, params = {}) => new Promise((r) => {
    pending.set(++seq, r);
    ws.send(JSON.stringify({ id: seq, method, params }));
  });

  const page = new URL("../store/promo.html", import.meta.url).href;
  for (const [file, w, h] of SIZES) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: `${page}?w=${w}&h=${h}` });
    // Wait until every Steam image has loaded.
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      const { result } = await send("Runtime.evaluate", {
        returnByValue: true,
        expression: `document.readyState === "complete" && [...document.images].every((i) => i.complete)`,
      });
      if (result.value) break;
    }
    const { data } = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    writeFileSync(new URL(`../store/${file}`, import.meta.url), Buffer.from(data, "base64"));
    console.log(`store/${file} (${w}x${h})`);
  }
  ws.close();
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
