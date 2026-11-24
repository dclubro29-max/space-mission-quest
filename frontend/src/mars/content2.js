// EXPLORE MARS 2.1 content (extends content.js tables at import time)
import { POIS, NPCS, BUILDINGS, ITEMS, RESOURCES, ACHIEVEMENTS, BOB_LINES } from "./content";

POIS.push(
  { id: "wreck_mars3", name: "Mars 3 Lander (1971)", type: "wreck", fx: 0.18, fy: 0.73, loot: { scrap: 4, titanium: 1 }, text: "The Soviet Mars 3 was the first spacecraft to land softly on Mars, in 1971. It sent 20 seconds of data, then went silent." },
  { id: "wreck_schiap", name: "Schiaparelli Lander (2016)", type: "wreck", fx: 0.62, fy: 0.6, loot: { scrap: 3, silicon: 3 }, text: "Europe's Schiaparelli test lander crashed in 2016 because its computer thought it had already landed. Oops." },
  { id: "wreck_polar", name: "Polar Lander (1999)", type: "wreck", fx: 0.4, fy: 0.08, loot: { scrap: 3, ice: 4 }, text: "NASA's Mars Polar Lander went silent in 1999. Engineers think it switched off its engines too early." },
  { id: "wreck_cargo", name: "Gratziella-0 Cargo Ship", type: "wreck", fx: 0.33, fy: 0.88, loot: { titanium: 3, crystal: 1 }, text: "The colony's first cargo ship. The captain's log talks about a hidden GOLDEN CITY in a crater far to the east... and there's a treasure map of the tunnels!", map: true },
  { id: "race_track", name: "Dust Bowl Raceway", type: "race", fx: 0.56, fy: 0.37, big: 11 },
  { id: "city", name: "Aurelia, the Golden City", type: "city", fx: 0.93, fy: 0.66, ring: 11, secret: true },
  { id: "monolith", name: "Black Monolith", type: "alien", fx: 0.04, fy: 0.33 },
);
NPCS.queen.at = [2.2, 2.4];
NPCS.lux = { name: "Mayor Lux", img: "/game/astronaut.png", role: "Mayor of Aurelia, the Golden City", poi: "city" };

Object.assign(BUILDINGS, {
  residential: { name: "Residential Ring", at: [0, 11], color: "#f4a261", cost: { credits: 350, iron: 10, silicon: 6 }, desc: "New families move in! +4 colonists and +40 credits rent every sol." },
  market_street: { name: "Market Street", at: [-11, -3], color: "#e76f51", cost: { credits: 400, iron: 8, scrap: 8 }, desc: "New shops: everything you buy is 15% cheaper." },
  spaceport: { name: "Spaceport & Tourist Center", at: [11, -3], color: "#90e0ef", cost: { credits: 500, titanium: 6, silicon: 8 }, desc: "Space tourists arrive! Guide tours for credits." },
  robot_factory: { name: "Robot Factory", at: [-4, -11], color: "#adb5bd", cost: { credits: 450, iron: 12, silicon: 6, titanium: 3 }, desc: "Build mining robots that mine for you." },
});
export const SECRET_BUILDING = { star_garden: { name: "Star Garden", at: [4, -11], color: "#c77dff" } };

Object.assign(ITEMS, {
  martian_gold: { name: "Martian Gold", kind: "res", color: "#d4af37", price: 150 },
  star_seed: { name: "Star Seed", kind: "key", desc: "A seed that glows like a tiny galaxy." },
  gold_statue: { name: "Golden B.O.B. Statue", kind: "decor", price: 600 },
  chandelier: { name: "Crystal Chandelier", kind: "decor", price: 500 },
  hot_tub: { name: "Martian Hot Tub", kind: "decor", price: 800 },
});
RESOURCES.push("martian_gold");
export const LUX_SHOP = ["gold_statue", "chandelier", "hot_tub"];

export const ROVER_COLORS = ["#ff7a1a", "#3a86ff", "#e0337a", "#2a9d8f", "#ffc93c", "#14213d", "#d4af37"];
export const DECALS = ["None", "Stripes", "Stars", "B.O.B. face", "Flames"];
export const LOCKED_STYLE = { color: 6, decal: 4 }; // need a race win

export const COLONIST_NAMES = ["Ana", "Mihai", "Elena", "Sorin", "Ioana", "Vlad", "Irina", "Tudor", "Bianca", "Radu", "Clara", "Dan"];
export const COLONIST_LINES = [
  "I moved to Mars for the view. And because Earth ran out of parking spaces.",
  "Did you know a day on Mars is 37 minutes longer? More time for naps!",
  "I tried to grow tomatoes. They grew. Then B.O.B. named them. Now I can't eat them.",
  "The Queen's Friday parties are legendary. B.O.B. is a terrible DJ, though.",
  "Watch out for dust storms. Last one took my hat. And my other hat.",
  "I heard there's a golden city somewhere in the east. Probably just a rumor...",
  "Strange lights near the Black Monolith at night. I'm NOT going there.",
  "My kid wants to be a rover pilot like you!",
  "Mars gravity is great. I can jump almost 3 times higher than on Earth!",
  "Red sand in my socks. Every. Single. Day.",
];

export const DAILY_TYPES = [
  { id: "mine", stat: "mined", n: 10, text: (n) => `Mine ${n} resources`, reward: 80 },
  { id: "dist", stat: "dist", n: 150, text: () => "Travel 1.5 km", reward: 70 },
  { id: "sell", stat: "sold", n: 8, text: (n) => `Sell ${n} items`, reward: 60 },
  { id: "craft", stat: "craftedTotal", n: 2, text: (n) => `Print ${n} items`, reward: 70 },
  { id: "photo", stat: "photos", n: 1, text: () => "Take a photo in Photo Mode", reward: 50 },
  { id: "race", stat: "races", n: 1, text: () => "Race B.O.B. at the Dust Bowl Raceway", reward: 90 },
  { id: "tour", stat: "tours", n: 1, text: () => "Guide one tourist group", reward: 100 },
];

export const WORLD_EVENTS = {
  aurora: { name: "Aurora Night", text: "A rare green aurora will dance in tonight's sky. Photos tonight earn bonus credits!" },
  comet: { name: "Comet Flyby", text: "A comet is crossing the Martian sky today! Snap a photo for a science bonus." },
  bloom: { name: "Crystal Bloom", text: "Glow crystals underground are blooming: +2 per mining today!" },
  caravan: { name: "Merchant Caravan", text: "A merchant caravan is visiting: all shop prices -30% today!" },
  bigmeteor: { name: "Meteorite Fall", text: "A huge meteorite just crashed nearby! Go mine the chunks before they cool." },
};

export const CHEST_LOOT = [
  { credits: 150, crystal: 2 }, { credits: 200, martian_gold: 1 }, { credits: 120, titanium: 3 }, { credits: 250, martian_gold: 1, crystal: 1 },
  { credits: 180, teddy: 1 }, { credits: 300, martian_gold: 2 }, { credits: 160, lava_lamp: 1 }, { credits: 400, martian_gold: 2, crystal: 2 },
];

export const SECRET_MISSIONS = [
  { title: "The Golden Rumor", goal: "Find Aurelia, the Golden City, in a crater far east (jetpack needed)", target: "city",
    trigger: (G) => G.salvaged.includes("wreck_cargo"), done: (G) => !!G.visited.city, reward: { credits: 300 },
    intro: [["bob", "A golden city?! On Mars?! Okay, I'm a robot, but I'd still like to see gold."]],
    outro: [["lux", "Welcome to Aurelia, traveler! We are the quiet colony. Only people with a Golden Pass may shop here."], ["bob", "A Martian city full of rich people. Finally, somewhere fancy enough for me."]] },
  { title: "VIP Pass", goal: "Buy a Golden Pass from Mayor Lux (300 credits + 5 Glow Crystals)", target: "city",
    trigger: () => true, done: (G) => !!G.flags.golden_pass, reward: { credits: 200 },
    intro: [["lux", "A Golden Pass costs 300 credits and 5 Glow Crystals. Crystals grow underground."]],
    outro: [["lux", "You are now a VIP of Aurelia! Our luxury shop is open to you. Also... have you seen the lights at the Black Monolith?"]] },
  { title: "Night Visitor", goal: "Visit the Black Monolith in the far west AT NIGHT", target: "monolith",
    trigger: () => true, done: (G) => !!G.flags.alien_met, reward: { credits: 300 },
    intro: [["bob", "Lights at a black monolith, at night. This is how every alien movie starts. I'm in."]],
    outro: [["bob", "We met an ALIEN. A real one. And it was nicer than most humans. No offense."]] },
  { title: "The Star Seed", goal: "Bring 3 Meteorite Chunks to the Black Monolith", target: "monolith",
    trigger: () => true, done: (G) => !!G.flags.star_seed, reward: { credits: 300 },
    intro: [["bob", "The alien wants 3 meteorite chunks. Meteorites fall during meteor showers and Meteorite Falls."]],
    outro: [["bob", "A Star Seed! The alien says to plant it in the colony greenhouse. Gardening, but cosmic."]] },
  { title: "Garden of Stars", goal: "Plant the Star Seed at the Greenhouse (build it first)", target: "greenhouse_b",
    trigger: () => true, done: (G) => G.buildings.includes("star_garden"), reward: { credits: 800 },
    intro: [["bob", "Take the Star Seed to the Greenhouse. If you don't have one, build it at the Colony Hub."]],
    outro: [["queen", "A Star Garden! The whole colony will celebrate tonight. Thank you, hero!"], ["bob", "I helped. I carried nothing, but emotionally I helped."]] },
];

ACHIEVEMENTS.push(...[
  ["photographer", "Photographer", "Take a photo in Photo Mode", (G) => G.stats.photos >= 1],
  ["racer", "Speed Racer", "Beat B.O.B. in a race", (G) => G.stats.raceWins >= 1],
  ["guide", "Tour Guide", "Complete 3 tourist tours", (G) => G.stats.tours >= 3],
  ["robots", "Robot Boss", "Own 3 mining robots", (G) => G.robots.length >= 3],
  ["salvager", "Salvager", "Salvage all 4 abandoned spacecraft", (G) => G.salvaged.length >= 4],
  ["treasure", "Treasure Hunter", "Open all 8 underground chests", (G) => G.chests.length >= 8],
  ["contact", "First Contact", "Meet the visitor at the Black Monolith", (G) => !!G.flags.alien_met],
  ["vip", "Golden VIP", "Get the Golden Pass of Aurelia", (G) => !!G.flags.golden_pass],
  ["secrets", "Secret Keeper", "Finish all 5 secret missions", (G) => G.secret.idx >= 5],
  ["daily", "Daily Hero", "Finish 5 daily challenges", (G) => G.stats.dailyDone >= 5],
  ["city", "City Builder", "Reach colony level 5", (G) => G.buildings.length >= 8],
].map(([id, name, desc, check]) => ({ id, name, desc, check })));

Object.assign(BOB_LINES, {
  photo: ["Say 'red planet'! Click. Gorgeous. I mean me, obviously."],
  race: ["Race me? I've been practicing since 2047. Prepare to eat dust. Literally."],
  raceWin: ["You beat me?! The rover was cheating. Rematch. Tomorrow. Maybe."],
  raceLose: ["I WIN! Robots 1, humans 0. I'll be signing autographs at the colony."],
  festival: ["Festival night! Fireworks on Mars! Don't stand too close, they're made in the 3D printer."],
  sleepy: ["Shh, they're sleeping. Even colonists need a recharge."],
  idle2: ["Fun fact: Mars has two moons, Phobos and Deimos. Like me and my ego.", "I calculated the odds of you finishing all quests. I'll keep them to myself."],
});
BOB_LINES.idle.push(...BOB_LINES.idle2);
