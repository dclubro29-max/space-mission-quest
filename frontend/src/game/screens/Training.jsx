import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Scene, Btn, BobSays } from "../ui";
import { COMPONENTS, TRAINING_KEYS } from "../data";
import { sfx } from "../sound";

const Card = ({ k, flipped, onFlip, i }) => {
  const c = COMPONENTS[k];
  const Icon = c.icon;
  return (
    <motion.button data-testid={`training-card-${k}`} onClick={onFlip}
      className={`train-card ${flipped ? "train-card-on" : ""}`}
      initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
      {!flipped ? (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <span className="icon-bubble"><Icon size={28} /></span>
          <span className="font-display text-xs sm:text-sm text-navy leading-tight">{c.name}</span>
        </div>
      ) : (
        <div className="text-left text-xs sm:text-sm leading-snug">
          <div className="font-display text-xs text-orange mb-1">{c.name}</div>
          <p className="font-bold">{c.info}</p>
          <p className="mt-1 text-navy/70 italic">{c.fact}</p>
        </div>
      )}
    </motion.button>
  );
};

export default function Training({ onDone }) {
  const [seen, setSeen] = useState(new Set());
  const [open, setOpen] = useState(null);
  const flip = (k) => { sfx.select(); setOpen(open === k ? null : k); setSeen(new Set(seen).add(k)); };
  const all = seen.size === TRAINING_KEYS.length;
  const bob = all ? "All 15 cards studied! Your brain must be overheating. Want me to fetch the thermal control system?"
    : seen.size === 0 ? "Tap a card to flip it. Yes, you have to read. I know. Tragic."
    : `${seen.size} of 15 studied. Keep going, the exam is coming!`;
  return (
    <Scene bg="/game/bg-training.jpg" testid="training-screen" className="overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="panel p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="text-orange" />
            <h2 className="font-display text-lg md:text-xl text-navy">Spacecraft Training</h2>
          </div>
          <span data-testid="training-progress" className="level-chip">{seen.size} / 15 studied</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-6">
          {TRAINING_KEYS.map((k, i) => <Card key={k} k={k} i={i} flipped={open === k} onFlip={() => flip(k)} />)}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-6">
          <BobSays text={bob} testid="training-bob-text" />
          <Btn data-testid="training-continue-btn" onClick={onDone}>{all ? "I'm ready!" : "Skip to mission"}</Btn>
        </div>
      </div>
    </Scene>
  );
}
