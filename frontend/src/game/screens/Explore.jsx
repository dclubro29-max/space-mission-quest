import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Check, X } from "lucide-react";
import { Scene, Btn } from "../ui";
import { sfx } from "../sound";

const SPOTS = [
  { id: "mountains", name: "Martian Mountains", x: 12, y: 26, fact: "Mars has Olympus Mons, the biggest volcano in the Solar System. It's about 22 km tall, almost 3 times taller than Mount Everest!", bob: "I tried to climb it once. I have tracks, not legs. It did not go well." },
  { id: "habitat", name: "Crew Habitat", x: 30, y: 49, fact: "Habitats on Mars must be sealed and pressurized, because the Martian air is very thin and mostly carbon dioxide.", bob: "This is where you'll sleep. The door opens automatically. You're welcome." },
  { id: "greenhouse", name: "Potato Greenhouse", x: 38, y: 41, fact: "Plants can grow in Martian greenhouses with water, light and nutrients. Potatoes are one of the best space crops!", bob: "Your 3 potatoes were not useless after all. I take back 2% of what I said." },
  { id: "palace", name: "Queen Gratziella's Palace", x: 67, y: 36, fact: "The biggest dome in the colony. Domes are strong shapes that hold air pressure inside really well.", bob: "The Queen throws a dance party every Friday. Attendance is mandatory. I'm the DJ." },
  { id: "solar", name: "Solar Farm", x: 77, y: 31, fact: "Mars gets less than half the sunlight Earth gets, and dust storms can cover the panels for weeks!", bob: "Somebody has to dust these. Guess who. Not me. YOU." },
  { id: "antenna", name: "Earth Link Antenna", x: 88, y: 30, fact: "Messages from Mars take between 3 and 22 minutes to reach Earth, depending on where the planets are.", bob: "Want to call your mom? Say hi, then wait 20 minutes. Very dramatic." },
  { id: "rover", name: "Rover Garage", x: 73, y: 68, fact: "Rovers explore Mars and study rocks. NASA's Perseverance even collects samples for future missions to bring back to Earth.", bob: "I asked for driving lessons. They said no, 'because of the door incident'." },
];
const NEED = 4;

const Stats = () => (
  <div className="flex flex-wrap gap-2 justify-center">
    {["Gravity: 38% of Earth", "Avg temp: -63°C", "1 day = 24h 37min", "1 year = 687 days"].map((t) => (
      <span key={t} className="level-chip !text-[0.65rem]">{t}</span>
    ))}
  </div>
);

export default function Explore({ name, onDone }) {
  const [seen, setSeen] = useState(new Set());
  const [open, setOpen] = useState(null);
  const spot = SPOTS.find((s) => s.id === open);
  const visit = (s) => { sfx.select(); setOpen(s.id); setSeen(new Set(seen).add(s.id)); };
  const bobPos = spot ? { left: `${spot.x + 3}%`, top: `${spot.y + 2}%` } : { left: "48%", top: "62%" };

  return (
    <Scene bg="/game/bg-mars.jpg" testid="explore-screen" className="overflow-y-auto">
      <div className="absolute inset-0 backdrop-blur-md bg-black/30" />
      <div className="relative flex flex-col items-center gap-3 py-4 px-2">
        <div className="panel px-5 py-3 flex flex-wrap items-center justify-center gap-4">
          <h2 className="font-display text-lg md:text-xl text-navy">Space Mission: Explore Mars & the Colony</h2>
          <span className="level-chip" data-testid="explore-progress">{seen.size} / {SPOTS.length} discovered</span>
        </div>
        <div className="explore-map" data-testid="explore-map">
          <img src="/game/bg-mars.jpg" alt="Mars colony" className="absolute inset-0 w-full h-full" />
          {SPOTS.map((s) => (
            <button key={s.id} data-testid={`explore-spot-${s.id}`} onClick={() => visit(s)}
              className={`hotspot ${seen.has(s.id) ? "hotspot-seen" : ""}`} style={{ left: `${s.x}%`, top: `${s.y}%` }} aria-label={s.name}>
              {seen.has(s.id) ? <Check size={18} /> : <MapPin size={18} />}
              <span className="hotspot-label">{s.name}</span>
            </button>
          ))}
          <motion.img src="/game/bob.png" alt="B.O.B." className="explore-bob" animate={bobPos} transition={{ type: "spring", stiffness: 60 }} />
          <AnimatePresence>
            {spot && (
              <motion.div key={spot.id} data-testid="explore-info" className="explore-info panel"
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
                <button data-testid="explore-info-close" className="absolute top-2 right-2" onClick={() => setOpen(null)}><X size={18} /></button>
                <div className="font-display text-sm text-orange">{spot.name}</div>
                <p className="font-bold text-navy text-sm sm:text-base mt-1">{spot.fact}</p>
                <p className="font-extrabold text-navy/70 text-sm mt-2 italic">B.O.B.: "{spot.bob}"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Stats />
        <Btn data-testid="explore-continue-btn" disabled={seen.size < NEED} onClick={onDone}
          className={seen.size < NEED ? "opacity-60 cursor-not-allowed" : ""}>
          {seen.size < NEED ? `Discover ${NEED - seen.size} more places, ${name}` : "Meet the colony"}
        </Btn>
      </div>
    </Scene>
  );
}
