import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, SkipForward } from "lucide-react";
import { Scene } from "./ui";
import { sfx } from "./sound";

const Sprite = ({ c, active }) => (
  <motion.img src={c.img} alt={c.name}
    className={`sprite ${active ? "sprite-active" : "sprite-idle"}`}
    style={{ height: c.h }}
    initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }} />
);

export default function Dialogue({ scene, characters, onDone, testid }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const line = scene.lines[i];
  const done = shown >= line.text.length;
  const speaker = characters[line.who];

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => { setShown((s) => s + 1); if (shown % 4 === 0) sfx.blip(); }, 20);
    return () => clearTimeout(t);
  }, [shown, done]);

  const next = () => {
    if (!done) return setShown(line.text.length);
    sfx.click();
    if (i < scene.lines.length - 1) { setI(i + 1); setShown(0); } else onDone();
  };

  return (
    <Scene bg={scene.bg} testid={testid}>
      <button data-testid="dialogue-skip-btn" className="skip-btn" onClick={onDone}>
        Skip <SkipForward size={16} />
      </button>
      <div className="cast-row">
        {scene.cast.map((k) => <Sprite key={k} c={characters[k]} active={k === line.who} />)}
      </div>
      <div className="dialogue-box" onClick={next} data-testid="dialogue-box">
        <div className="name-tag" style={{ background: speaker.color }} data-testid="dialogue-speaker">{speaker.name}</div>
        <p className="text-lg sm:text-xl md:text-2xl font-bold leading-snug min-h-[4.5rem]" data-testid="dialogue-text">
          {line.text.slice(0, shown)}
        </p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs font-bold text-navy/50">{i + 1} / {scene.lines.length}</span>
          <button data-testid="dialogue-next-btn" className="toon-btn toon-btn-orange !py-2 !px-5 text-base"
            onClick={(e) => { e.stopPropagation(); next(); }}>
            {done ? (i < scene.lines.length - 1 ? "Next" : "Continue") : "..."} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </Scene>
  );
}
