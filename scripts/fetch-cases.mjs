// Generates app/cases.js from the public CSGO-API dataset (real cases, real skins, Steam images).
// Usage: npm run cases
import { writeFile } from "node:fs/promises";

const SRC = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json";

// Case name → fake price (€ or $, same number). Pick whatever cases you like here.
const PICKS = {
  "Kilowatt Case": 2.5,
  "Revolution Case": 2.5,
  "Dreams & Nightmares Case": 3,
  "Recoil Case": 3,
  "Fracture Case": 4,
  "Gamma Case": 6,
  "Operation Breakout Weapon Case": 10,
  "CS:GO Weapon Case": 25,
};

const RARITY = {
  "Mil-Spec Grade": "blue",
  "Restricted": "purple",
  "Classified": "pink",
  "Covert": "red",
};

const crates = await (await fetch(SRC)).json();
const out = [];

for (const [name, price] of Object.entries(PICKS)) {
  const c = crates.find((x) => x.name === name);
  if (!c) { console.warn("missing:", name); continue; }
  const items = { blue: [], purple: [], pink: [], red: [], gold: [] };
  for (const s of c.contains) {
    const r = RARITY[s.rarity.name];
    if (r) items[r].push([s.name, s.image]);
  }
  // Knives / gloves: dedupe by name (Doppler phases share a name).
  const seen = new Set();
  for (const s of c.contains_rare) {
    const n = s.phase ? `${s.name} (${s.phase})` : s.name;
    if (seen.has(n)) continue;
    seen.add(n);
    items.gold.push([n, s.image]);
  }
  out.push({ id: c.id, name: c.name.replace(/ (Weapon )?Case$/, ""), price, image: c.image, items });
  console.log(`${name}: ${Object.values(items).map((a) => a.length).join("/")}`);
}

// ---------- Special cases: knives / gloves only ----------
// Every rare item in the game, tiered by finish so the reel still has colours.
const rare = new Map();
for (const c of crates) {
  for (const s of c.contains_rare || []) {
    const n = s.phase ? `${s.name} (${s.phase})` : s.name;
    if (!rare.has(n)) rare.set(n, s.image);
  }
}

const KNIFE_TIERS = [
  ["gold",   /Ruby|Sapphire|Black Pearl|Emerald/],
  ["red",    /Gamma Doppler|Doppler \(Phase 2\)|Lore|Autotronic|Marble Fade/],
  ["pink",   /Fade|Doppler|Tiger Tooth|Slaughter|Crimson Web|Case Hardened/],
  ["blue",   /Safari Mesh|Boreal Forest|Scorched|Urban Masked|Forest DDPAT|Night Stripe/],
  ["purple", /./],
];
const GLOVE_TIERS = [
  ["gold",   /Pandora's Box|Vice|Hedge Maze|Crimson Kimono/],
  ["red",    /Fade|Emerald Web|Superconductor|Omega|Amphibious|Slingshot|King Snake|Foundation|Spearmint|Crimson Weave|Lt\. Commander/],
  ["pink",   /Cool Mint|Polygon|Imperial Plaid|Cobalt Skulls|Marble|Mogul|Overtake|Crimson Web|Emerald|Snow Leopard|Black Tie|Nocts/],
  ["blue",   /Arid|Bronzed|Charred|Guerrilla|Convoy|Lunar Weave|Diamondback|Badlands|Spruce DDPAT|Leather|Eclipse|Forest DDPAT|Rattler|Mangrove|Arboreal|Duct Tape|Turtle|Transport|Buckshot|Jade|Yellow-banded|Desert Shamagh|Field Agent/],
  ["purple", /./],
];
// Value factor per knife / glove model (3rd element of each item).
const MODEL_FACTOR = {
  "Karambit": 1.7, "Butterfly Knife": 1.7, "M9 Bayonet": 1.4, "Skeleton Knife": 1.3, "Talon Knife": 1.2,
  "Bayonet": 1.1, "Sport Gloves": 1.5, "Specialist Gloves": 1.2, "Moto Gloves": 1.1,
  "Gut Knife": 0.6, "Navaja Knife": 0.55, "Shadow Daggers": 0.55, "Hydra Gloves": 0.7, "Broken Fang Gloves": 0.7,
  "Bowie Knife": 0.75, "Falchion Knife": 0.75, "Paracord Knife": 0.75, "Survival Knife": 0.75, "Hand Wraps": 0.8,
};
const modelOf = (n) => n.replace("★ ", "").split(" | ")[0];

// theme: [main colour, dark colour] of the drawn case (see caseArt in app.js).
function specialCase(id, name, price, cover, theme, filter, tiers, odds, mults) {
  const items = { blue: [], purple: [], pink: [], red: [], gold: [] };
  for (const [n, img] of rare) {
    if (!filter(n)) continue;
    const tier = tiers.find(([, re]) => re.test(n.split(" | ")[1] || "Vanilla"))[0];
    items[tier].push([n, img, MODEL_FACTOR[modelOf(n)] || 1]);
  }
  out.push({ id, name, price, image: rare.get(cover), theme, special: true, odds, mults, items });
  console.log(`${name}: ${Object.values(items).map((a) => a.length).join("/")}`);
}

const isGlove = (n) => /Gloves|Wraps/.test(n);
const DEFAULT_ODDS = { blue: 45, purple: 33, pink: 15, red: 5.5, gold: 1.5 };
const DEFAULT_MULTS = { blue: 0.3, purple: 0.6, pink: 1.4, red: 3, gold: 9 };

specialCase("special-knives", "Couteaux", 100, "★ Butterfly Knife | Fade", ["#ff4d5e", "#5c0a1a"], (n) => !isGlove(n), KNIFE_TIERS, DEFAULT_ODDS, DEFAULT_MULTS);
specialCase("special-gloves", "Gants", 80, "★ Sport Gloves | Vice", ["#2ee6a6", "#06402f"], isGlove, GLOVE_TIERS, DEFAULT_ODDS, DEFAULT_MULTS);
specialCase("special-karambit", "Karambit", 200, "★ Karambit | Fade", ["#b46bff", "#2e0f5c"], (n) => n.includes("Karambit"), KNIFE_TIERS, DEFAULT_ODDS, DEFAULT_MULTS);
specialCase("special-doppler", "Doppler", 250, "★ M9 Bayonet | Doppler (Sapphire)", ["#3cc8ff", "#0b2a66"], (n) => n.includes("Doppler"), KNIFE_TIERS,
  { pink: 84, red: 13, gold: 3 }, { pink: 0.6, red: 1.4, gold: 5 });

// Special cases first in the picker.
out.unshift(...out.splice(out.findIndex((c) => c.special)));

await writeFile(
  new URL("../app/cases.js", import.meta.url),
  "// Generated by scripts/fetch-cases.mjs — do not edit by hand.\n" +
  "// [name, image] per rarity. Data: github.com/ByMykel/CSGO-API\n" +
  `const CASE_DATA = ${JSON.stringify(out)};\n`,
);
