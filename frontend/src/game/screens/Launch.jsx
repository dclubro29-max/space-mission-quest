import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Scene, Btn } from "../ui";
import { Rocket } from "../Rocket";
import { sfx } from "../sound";

export default function Launch({ onDone }) {
  const [count, setCount] = useState(null);
  const [lift, setLift] = useState(false);

  useEffect(() => {
    if (count === null || lift) return;
    if (count === 0) { setLift(true); sfx.launch(); setTimeout(onDone, 3200); return; }
    sfx.click();
    const t = setTimeout(() => setCount(count - 1), 800);
    return () => clearTimeout(t);
  }, [count, lift, onDone]);

  return (
    <Scene bg="/game/bg-launchpad.jpg" testid="launch-screen" className={`overflow-hidden ${lift ? "rumble" : ""}`}>
      <motion.div className="absolute left-0 right-0 mx-auto bottom-[3vh] w-52 sm:w-64 lg:w-[22rem]"
        animate={lift ? { y: "-130vh" } : { y: 0 }} transition={{ duration: 3, ease: "easeIn" }}>
        <Rocket flame={lift} className="w-full" />
      </motion.div>
      {lift && <div className="smoke" />}
      <div className="absolute top-[8vh] left-[4vw] sm:top-1/3 flex flex-col items-start gap-6 z-10">
        {count === null && (
          <>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-cream title-shadow text-center px-4">Rocket G-1 ready</h1>
            <Btn variant="red" data-testid="launch-btn" className="!text-2xl !px-10 !py-5" onClick={() => setCount(5)}>LAUNCH!</Btn>
          </>
        )}
        {count !== null && !lift && (
          <motion.div key={count} data-testid="launch-countdown" className="font-display text-8xl sm:text-9xl text-cream title-shadow"
            initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{count}</motion.div>
        )}
        {lift && <div className="font-display text-5xl sm:text-6xl text-orange title-shadow">LIFT-OFF!</div>}
      </div>
    </Scene>
  );
}
