import { useEffect } from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { Scene, Btn } from "../ui";
import { COLONY } from "../data";
import { sfx } from "../sound";

const Confetti = () => (
  <div className="confetti" aria-hidden>
    {Array.from({ length: 40 }).map((_, i) => (
      <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 10) * 0.3}s`, background: ["#ff7a1a", "#ffc93c", "#e0337a", "#3fe0ff"][i % 4] }} />
    ))}
  </div>
);

export default function Colony({ win, name, onDone }) {
  useEffect(() => { win ? sfx.fanfare() : sfx.select(); }, [win]);
  return (
    <Scene bg="/game/bg-mars.jpg" testid="colony-screen" className="overflow-y-auto">
      {win && <Confetti />}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center gap-4 min-h-full">
        <motion.div className="panel px-6 py-4 text-center" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 data-testid="colony-title" className="font-display text-3xl sm:text-4xl lg:text-5xl text-navy">
            {win ? "Congratulations! Welcome to the colony Gratziella" : "The colony Gratziella is still waiting for you!"}
          </h1>
          <p className="text-base md:text-lg font-bold text-navy/80 mt-2" data-testid="colony-queen-line">
            {win
              ? `Queen Gratziella: "Welcome home, ${name}! You fixed every problem like a true space engineer."`
              : `Queen Gratziella: "We saw the fireworks from here, ${name}. Don't worry, the escape pod brought the crew home. Train harder and come back!"`}
          </p>
        </motion.div>
        <div className="flex flex-wrap justify-center items-end gap-2 sm:gap-4 mt-auto">
          {COLONY.map((p, i) => (
            <motion.div key={p.name} className="flex flex-col items-center" data-testid={`colonist-${i}`}
              initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.25, type: "spring", bounce: 0.45 }}>
              <img src={p.img} alt={p.name} className={`colonist ${p.queen ? "h-[42vh]" : "h-[30vh] sm:h-[34vh]"}`} />
              <span className={`name-plate ${p.queen ? "name-plate-queen" : ""}`}>{p.queen && <Crown size={14} />} {p.name}</span>
            </motion.div>
          ))}
        </div>
        <Btn data-testid="colony-credits-btn" className="mt-2 mb-4" onClick={onDone}>Roll the credits</Btn>
      </div>
    </Scene>
  );
}
