import {
  bob, buy, buyPrice, checkProgress, consumeItem, deleteSave, findNear,
  interact, loadGame, navPoint, resolveTarget, saveGame, sellPrice, update, world,
} from "./engine";

const ui = { open: jest.fn(), talk: jest.fn() };
const poi = (g, id) => world(g)[g.layer].pois.find((p) => p.id === id);

beforeEach(() => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: jest.fn(),
  });
  localStorage.clear();
  jest.clearAllMocks();
});

test("the first beacon leads to Queen Gratziella and talking advances the story", () => {
  const g = loadGame("Cadet");
  checkProgress(g);
  const target = resolveTarget(g, world(g));
  expect(target.label).toBe("Queen Gratziella");
  g.p = { x: target.x, y: target.y };
  const near = findNear(g, world(g));
  expect(near).toMatchObject({ kind: "npc", id: "queen" });
  interact(g, near, ui);
  expect(ui.talk).toHaveBeenCalledWith("queen");
  checkProgress(g);
  expect(g.story).toBe(1);
  expect(g.credits).toBe(220);
});

test("signal objectives advance on decoding and retain decoded beacons across a v1 save", () => {
  const g = loadGame("Cadet");
  g.story = 6;
  g.visited.signal_b = g.visited.signal_c = true;
  checkProgress(g);
  checkProgress(g);
  expect(g.story).toBe(6);
  expect(resolveTarget(g, world(g)).label).toBe("Signal Beta");
  interact(g, { kind: "poi", poi: poi(g, "signal_b") }, ui);
  expect(saveGame(g)).toBe(true);
  const resumed = loadGame("");
  expect(resumed.name).toBe("Cadet");
  expect(resolveTarget(resumed, world(resumed)).label).toBe("Signal Gamma");
  interact(resumed, { kind: "poi", poi: poi(resumed, "signal_c") }, ui);
  checkProgress(resumed);
  expect(resumed.story).toBe(7);
});

test("market rejects unaffordable purchases and avoids buy/sell arbitrage", () => {
  const g = loadGame("Cadet");
  g.credits = 0;
  g.buildings = ["refinery", "market_street"];
  g.worldEvent = { sol: g.sol, type: "caravan" };
  expect(buyPrice(g, "iron")).toBeGreaterThan(sellPrice(g, "iron"));
  expect(buy(g, "iron")).toBe(false);
  expect(g.credits).toBe(0);
  expect(g.inv.iron).toBeUndefined();
  expect(g.tmp.queue).toContainEqual({ kind: "toast", text: expect.stringMatching(/Still needed: \d+ credits/) });
});

test("supplies are kept at full stats, while a repair kit can fix a leak at full health", () => {
  const g = loadGame("Cadet");
  expect(consumeItem(g, "o2_canister")).toBe(false);
  expect(g.inv.o2_canister).toBe(2);
  expect(consumeItem(g, "repair_kit")).toBe(false);
  g.emerg = { type: "leak", t: 20 };
  expect(consumeItem(g, "repair_kit")).toBe(true);
  expect(g.inv.repair_kit).toBe(0);
  expect(g.emerg).toBeNull();
});

test("storms increase outdoor oxygen drain and a cave leads toward the underground objective", () => {
  const clear = loadGame("Cadet");
  const storm = loadGame("Cadet");
  const entrance = poi(storm, "cave_lava");
  clear.p = storm.p = { x: entrance.x, y: entrance.y };
  storm.story = clear.story = 10;
  storm.weather = { type: "storm", t: 45 };
  update(clear, { x: 0, y: 0 }, 0.05);
  update(storm, { x: 0, y: 0 }, 0.05);
  expect(storm.o2).toBeLessThan(clear.o2);
  const target = resolveTarget(storm, world(storm));
  expect(target.layer).toBe("under");
  expect(navPoint(storm, world(storm), target).label).toMatch(/Underground Lab/);
  interact(storm, { kind: "poi", poi: entrance }, ui);
  expect(storm.layer).toBe("under");
  expect(storm.tmp.queue).toContainEqual({ kind: "sfx", name: "marsAirlock" });
});

test("B.O.B. rotates replies and reset starts a new save without restoring the previous one", () => {
  const g = loadGame("Cadet");
  bob(g, "full", 0);
  g.tmp.clock = 10;
  bob(g, "full", 0);
  expect(g.tmp.queue[0].text).not.toBe(g.tmp.queue[1].text);
  expect(saveGame(g)).toBe(true);
  deleteSave();
  expect(saveGame(g)).toBe(false);
  expect(saveGame(loadGame("New cadet"))).toBe(true);
  expect(loadGame("").name).toBe("New cadet");
});
