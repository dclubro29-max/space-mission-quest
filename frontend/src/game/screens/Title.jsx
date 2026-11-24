import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket as RocketIcon, Globe } from "lucide-react";
import { Scene, Btn } from "../ui";
import { sfx } from "../sound";

export default function Title({ onStart, onExplore }) {
  const unlocked = localStorage.getItem("explore-mars-unlocked") === "1";
  const marsPreview = new URLSearchParams(window.location.search).get("preview") === "mars";
  const [name, setName] = useState("");
  const start = () => { sfx.fanfare(); onStart(name.trim() || "Rookie"); };
  return (
    <Scene bg="/game/bg-space.jpg" testid="title-screen" className="flex items-center">
      <div className="w-full max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-center">
        <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="level-chip">NASA Space Apps Challenge 2026</div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-cream mt-5 title-shadow leading-[0.95]">
            Space<br /><span className="text-orange">Mission</span>
          </h1>
          <p className="text-base md:text-lg text-cream/90 font-semibold mt-5 max-w-md">
            Train with a very sarcastic robot, rebuild the mission plan, pass the exam and fix your rocket on the way to Mars!
          </p>
          <div className="panel mt-8 p-5 max-w-md">
            <label htmlFor="cadet" className="font-display text-sm text-navy">Cadet name</label>
            <div className="flex gap-3 mt-2">
              <input id="cadet" data-testid="cadet-name-input" maxLength={20} value={name}
                onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && start()}
                className="toon-input flex-1" placeholder="Type your name" />
              <Btn data-testid="start-game-btn" onClick={start}>Start <RocketIcon size={20} /></Btn>
            </div>
          </div>
          {(unlocked || marsPreview) && <Btn variant="red" data-testid="title-explore-mars-btn" className="mt-4" onClick={() => { sfx.select(); onExplore(name.trim()); }}><Globe size={20} /> {unlocked ? "EXPLORE MARS" : "EXPLORE MARS PREVIEW"}</Btn>}
          <p className="text-cream/70 text-sm mt-4 font-semibold">A game by the Space Hackers team</p>
        </motion.div>
        <motion.div className="relative flex justify-center" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }}>
          <img src="/game/bob.png" alt="B.O.B." className="w-64 sm:w-80 lg:w-[26rem] bob-float drop-shadow-2xl" />
          <div className="bubble bubble-left absolute top-0 right-0 md:-right-4 w-52 h-fit text-base">
            Oh great. Another human. Press Start, I guess.
          </div>
        </motion.div>
      </div>
    </Scene>
  );
}
