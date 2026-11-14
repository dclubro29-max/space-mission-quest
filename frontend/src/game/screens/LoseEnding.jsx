import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flower2 } from "lucide-react";
import { Scene, Btn } from "../ui";
import { Rocket } from "../Rocket";
import { sfx } from "../sound";

const Caption = ({ children }) => (
  <motion.div className="bubble max-w-md text-center mx-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>{children}</motion.div>
);

const Boom = () => (
  <Scene bg="/game/bg-space.jpg" testid="lose-explosion" className="flex items-center justify-center overflow-hidden">
    <motion.div className="w-32" animate={{ x: [0, -10, 10, -10, 10, 0], scale: [1, 1, 0] }} transition={{ duration: 1.2 }}>
      <Rocket className="w-full" broken />
    </motion.div>
    <motion.div className="boom" initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1.1] }} transition={{ delay: 1, duration: 0.6 }}>
      <span className="font-display text-6xl sm:text-8xl text-navy">BOOM!</span>
    </motion.div>
    <div className="flash" />
  </Scene>
);

const Drift = ({ n }) => (
  <Scene bg="/game/bg-space.jpg" testid="lose-drift" className="overflow-hidden">
    <div className="absolute top-[10vh] inset-x-0 px-4 flex flex-col gap-3">
      <Caption>Luckily, the crew escaped in the emergency pod. B.O.B. was not so lucky...</Caption>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
        <Caption>B.O.B.: "Well. That went great. At least out here, nobody bumps into doors, {n}."</Caption>
      </motion.div>
    </div>
    <motion.img src="/game/bob.png" alt="B.O.B. floating" className="absolute w-40 sm:w-52 drop-shadow-2xl"
      initial={{ left: "-20%", top: "55%", rotate: 0 }} animate={{ left: "110%", top: "35%", rotate: 540 }} transition={{ duration: 7, ease: "linear" }} />
  </Scene>
);

const sadLines = (n) => [
  "B.O.B. drifted alone for 7 long months... and finally landed on Mars.",
  `B.O.B.: "Hey, cadet ${n}. I brought you something. It's a flower. I grew it myself. Don't make it weird."`,
  `B.O.B.: "I made fun of you every single day. Do you know why? Because you were my favorite human."`,
  `B.O.B.: "Who will bump into doors now? Who will bring potatoes to space? It's too quiet without you."`,
  `B.O.B.: "My eyes are leaking. It's just space dust. Robots don't cry... Okay. Maybe a little."`,
];
export const SAD_MS = 4200;

const Grave = ({ n, stoopid, onDone }) => {
  const [line, setLine] = useState(0);
  const lines = sadLines(n);
  useEffect(() => {
    if (line >= lines.length - 1) return;
    const t = setTimeout(() => setLine(line + 1), SAD_MS);
    return () => clearTimeout(t);
  }, [line, lines.length]);
  return (
  <Scene bg="/game/bg-mars-empty.jpg" testid="lose-grave" className="overflow-hidden">
    <div className="tombstone" data-testid="grave-stone">
      <span className="font-display text-lg">R.I.P.</span>
      <span className="text-sm font-extrabold">Rocket G-1</span>
      <span className="text-xs font-bold">2049 - 2049</span>
      <span className="text-[10px] font-bold mt-1">Piloted by cadet {n}. It lost a fight against a malfunction.</span>
      <motion.span className="grave-flower" data-testid="grave-flower" initial={{ scale: 0, y: -60, rotate: -30 }} animate={{ scale: 1, y: 0, rotate: [0, -6, 6, 0] }} transition={{ delay: 5, type: "spring", bounce: 0.5 }}>
        <Flower2 size={150} strokeWidth={1.6} className="text-pink-600 fill-pink-300 drop-shadow-[4px_4px_0_#111]" />
      </motion.span>
    </div>
    <motion.img src="/game/bob.png" alt="B.O.B." className="absolute bottom-[10vh] w-32 sm:w-44 drop-shadow-2xl"
      initial={{ left: "50%", y: "-100vh", rotate: 200 }} animate={{ left: ["50%", "50%", "53%"], y: ["-100vh", "0vh", "0vh"], rotate: [200, 0, 0] }}
      transition={{ duration: 4, times: [0, 0.5, 1] }} />
    <div className="absolute top-[8vh] inset-x-0 px-4 flex flex-col items-center gap-4">
      {!stoopid && <Caption key={line}><span data-testid="bob-sad-text">{lines[line]}</span></Caption>}
      {stoopid && (
        <>
          <motion.h1 data-testid="stoopids-text" className="font-display text-6xl sm:text-7xl lg:text-8xl text-orange title-shadow"
            initial={{ scale: 0, rotate: -15 }} animate={{ scale: [0, 1.3, 1], rotate: [-15, 5, -3] }}>STOOOOPIDS!</motion.h1>
          <Btn data-testid="lose-continue-btn" onClick={onDone}>Continue</Btn>
        </>
      )}
    </div>
    {line >= 4 && !stoopid && <div className="tears" aria-hidden><i /><i /></div>}
  </Scene>
  );
};

export default function LoseEnding({ name, onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const steps = [() => sfx.explode(), () => sfx.sad(), () => {}, () => sfx.bonk()];
    steps[phase]?.();
    const delays = [2600, 7500, SAD_MS * 5 + 1500];
    if (phase > 2) return;
    const t = setTimeout(() => setPhase(phase + 1), delays[phase]);
    return () => clearTimeout(t);
  }, [phase]);
  if (phase === 0) return <Boom />;
  if (phase === 1) return <Drift n={name} />;
  return <Grave n={name} stoopid={phase === 3} onDone={onDone} />;
}
