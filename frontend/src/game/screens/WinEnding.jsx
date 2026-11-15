import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Scene, Btn, BobSays } from "../ui";
import { Rocket } from "../Rocket";
import { sfx } from "../sound";

export default function WinEnding({ onDone }) {
  const [landed, setLanded] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setLanded(true); sfx.fanfare(); }, 2600); return () => clearTimeout(t); }, []);
  return (
    <Scene bg="/game/bg-mars-empty.jpg" testid="win-ending-screen" className="overflow-hidden">
      <motion.div className="absolute left-0 right-0 mx-auto bottom-[14vh] w-24 sm:w-32"
        initial={{ y: "-110vh" }} animate={{ y: 0 }} transition={{ duration: 2.5, ease: "easeOut" }}>
        <Rocket flame={!landed} className="w-full" />
      </motion.div>
      {landed && <div className="dust" />}
      {landed && (
        <motion.div className="absolute inset-x-0 top-[10vh] flex flex-col items-center gap-6 px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-cream title-shadow">TOUCHDOWN!</h1>
          <BobSays text="We landed. Nobody exploded. I am genuinely shocked. Let's go explore Mars and the colony!" testid="win-bob-text" />
          <Btn data-testid="win-continue-btn" onClick={onDone}>Explore Mars</Btn>
        </motion.div>
      )}
    </Scene>
  );
}
