import { useState } from "react";
import { motion } from "framer-motion";
import { Scene, Btn, BobSays } from "../ui";
import { JOKES } from "../data";
import { sfx } from "../sound";

export default function DoorGag({ onDone }) {
  const [bonks, setBonks] = useState(0);
  const [open, setOpen] = useState(false);
  const [shake, setShake] = useState(0);
  const [msg, setMsg] = useState("The training center is right behind this door. Go on in, cadet.");

  const bonk = (how) => {
    sfx.bonk();
    setBonks((b) => b + 1);
    setShake((s) => s + 1);
    setMsg(bonks >= 1 ? JOKES.door : `You tried to ${how}. The door won. ${bonks === 0 ? "Again?" : ""}`);
  };
  const openDoor = () => {
    sfx.success();
    setOpen(true);
    setMsg(bonks ? "FINALLY. Historians will write about this day." : "Wow. First try. I had a bet that you'd headbutt it.");
  };

  return (
    <Scene bg="/game/bg-training.jpg" testid="door-gag-screen" className="flex flex-col items-center justify-center gap-6 px-4">
      <div className="flex items-end gap-6 sm:gap-12">
        <motion.img key={shake} src="/game/alex.png" alt="cadet" className="h-[38vh] drop-shadow-xl"
          animate={shake ? { x: [0, 40, -20, 0], rotate: [0, 8, -6, 0] } : {}} transition={{ duration: 0.5 }} />
        <div className="door" data-testid="training-door">
          <motion.div className="door-leaf" animate={{ rotateY: open ? -75 : 0 }} transition={{ type: "spring" }}>
            <span className="font-display text-navy text-sm">TRAINING</span>
            <span className="door-knob" />
          </motion.div>
          {bonks > 0 && !open && <span className="bonk" key={bonks}>BONK!</span>}
        </div>
      </div>
      <BobSays text={msg} testid="door-bob-text" />
      {!open ? (
        <div className="flex flex-wrap gap-3 justify-center">
          <Btn variant="navy" data-testid="door-walk-btn" onClick={() => bonk("walk through it")}>Walk straight in</Btn>
          <Btn variant="navy" data-testid="door-jump-btn" onClick={() => bonk("jump through it")}>Jump through it</Btn>
          <Btn data-testid="door-open-btn" onClick={openDoor}>Open the door</Btn>
        </div>
      ) : (
        <Btn data-testid="door-continue-btn" onClick={() => onDone(bonks)}>Enter training center</Btn>
      )}
    </Scene>
  );
}
