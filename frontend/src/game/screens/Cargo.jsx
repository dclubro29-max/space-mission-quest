import { useState } from "react";
import { motion } from "framer-motion";
import { Wind, Droplets, Utensils, Wrench, Mountain, Bean, Guitar, PawPrint, Package } from "lucide-react";
import { Scene, Btn, BobSays } from "../ui";
import { JOKES } from "../data";
import { sfx } from "../sound";

const CAP = 100;
const ITEMS = [
  { id: "oxygen", name: "Oxygen tanks", kg: 30, icon: Wind, need: true, note: "Breathing. Highly recommended." },
  { id: "water", name: "Water supply", kg: 20, icon: Droplets, need: true, note: "The trip takes about 7 months!" },
  { id: "food", name: "Space food", kg: 15, icon: Utensils, need: true, note: "Freeze-dried pizza. Yum?" },
  { id: "parts", name: "Spare parts kit", kg: 20, icon: Wrench, need: true, note: "Needed to repair malfunctions." },
  { id: "rocks", name: "17 rocks", kg: 17, icon: Mountain, note: "Mars has PLENTY of rocks." },
  { id: "potatoes", name: "3 potatoes", kg: 3, icon: Bean, note: "Could grow on Mars. Maybe." },
  { id: "guitar", name: "Electric guitar", kg: 12, icon: Guitar, note: "For space concerts." },
  { id: "teddy", name: "Teddy bear", kg: 8, icon: PawPrint, note: "Emotional support." },
];

export default function Cargo({ onDone }) {
  const [loaded, setLoaded] = useState(new Set(["rocks", "potatoes"]));
  const [bob, setBob] = useState(JOKES.inventory);
  const mass = ITEMS.filter((x) => loaded.has(x.id)).reduce((s, x) => s + x.kg, 0);
  const over = mass > CAP;

  const toggle = (it) => {
    sfx.select();
    const s = new Set(loaded);
    s.has(it.id) ? s.delete(it.id) : s.add(it.id);
    setLoaded(s);
    if (it.id === "rocks" && s.has("rocks")) setBob("Taking rocks TO the red rock planet. Genius.");
  };
  const launch = () => {
    const missing = ITEMS.filter((x) => x.need && !loaded.has(x.id));
    if (missing.length) { sfx.fail(); return setBob(`No ${missing[0].name.toLowerCase()}?! What's the plan, hold your breath for 7 months?`); }
    if (over) { sfx.fail(); return setBob(`${mass} kg! The limit is ${CAP} kg. Heavier rocket = more fuel. Something has to go!`); }
    sfx.success();
    onDone([...loaded]);
  };

  return (
    <Scene bg="/game/bg-launchpad.jpg" testid="cargo-screen" className="overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">
        <div className="panel p-5">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="font-display text-lg md:text-xl text-navy flex items-center gap-2"><Package className="text-orange" /> Cargo Check</h2>
            <span className={`level-chip ${over ? "!bg-red-500" : ""}`} data-testid="cargo-mass">{mass} / {CAP} kg</span>
          </div>
          <div className="mass-bar mt-3"><motion.div className={`mass-fill ${over ? "mass-over" : ""}`} animate={{ width: `${Math.min(100, (mass / CAP) * 100)}%` }} /></div>
          <p className="text-sm font-semibold text-navy/70 mt-2">Every kilogram needs extra fuel. Pack what keeps the crew alive and the ship repairable first!</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ITEMS.map((it) => {
            const Icon = it.icon; const on = loaded.has(it.id);
            return (
              <button key={it.id} data-testid={`cargo-item-${it.id}`} onClick={() => toggle(it)} className={`cargo-item ${on ? "cargo-on" : ""}`}>
                <span className="icon-bubble"><Icon size={24} /></span>
                <span className="font-display text-xs text-navy mt-2">{it.name}</span>
                <span className="text-sm font-extrabold text-orange">{it.kg} kg {it.need && "· needed"}</span>
                <span className="text-xs font-semibold text-navy/60">{it.note}</span>
                <span className="cargo-flag">{on ? "LOADED" : "ADD"}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-between items-end gap-4">
          <BobSays text={bob} testid="cargo-bob-text" />
          <Btn data-testid="cargo-launch-btn" onClick={launch}>Ready for launch</Btn>
        </div>
      </div>
    </Scene>
  );
}
