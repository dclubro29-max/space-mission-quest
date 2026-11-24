import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, SkipForward } from "lucide-react";
import { Scene, Btn } from "../ui";
import { CREATORS, COLONY } from "../data";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Roll = ({ onEnd, result }) => (
  <motion.div className="credits-roll" initial={{ y: "100vh" }} animate={{ y: "-100%" }} transition={{ duration: 26, ease: "linear" }} onAnimationComplete={onEnd}>
    <p className="font-display text-orange text-xl">Space Hackers present</p>
    <h1 className="font-display text-5xl sm:text-6xl text-cream mt-3">Space Mission</h1>
    <p className="credits-head">Created by</p>
    {CREATORS.map((c) => {
      const img = COLONY.find((p) => p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === c.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))?.img;
      return (
        <div key={c} className="flex items-center justify-center gap-4 mt-4" data-testid="credits-creator">
          {img && <img src={img} alt={c} className="h-20 w-20 object-cover object-top rounded-full border-4 border-orange bg-cream" />}
          <span className="font-display text-2xl sm:text-3xl text-cream">{c}</span>
        </div>
      );
    })}
    <p className="credits-head">Starring</p>
    <p className="text-cream text-xl font-bold">B.O.B. as Himself (sarcastically)</p>
    <p className="text-cream text-xl font-bold">Commander Rex · Captain Nova · Cadet {result.name}</p>
    <p className="text-cream text-xl font-bold">Queen Gratziella and the Colony</p>
    <p className="credits-head">Made for</p>
    <p className="text-cream text-xl font-bold">NASA Space Apps Challenge 2026<br />Space Mission Design Game</p>
    <p className="credits-head">Special thanks</p>
    <p className="text-cream text-xl font-bold">The door. For being a worthy opponent.</p>
    <p className="text-cream text-xl font-bold">3 potatoes.</p>
  </motion.div>
);

export default function Credits({ result, onRestart }) {
  const [ended, setEnded] = useState(false);
  const [board, setBoard] = useState([]);
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    axios.post(`${API}/scores`, result).catch(() => {}).finally(() =>
      axios.get(`${API}/scores`).then((r) => setBoard(r.data)).catch(() => {}));
  }, [result]);

  return (
    <Scene bg="/game/bg-space.jpg" testid="credits-screen" className="overflow-hidden">
      {!ended ? (
        <>
          <button data-testid="credits-skip-btn" className="skip-btn" onClick={() => setEnded(true)}>Skip <SkipForward size={16} /></button>
          <Roll result={result} onEnd={() => setEnded(true)} />
        </>
      ) : (
        <div className="h-full overflow-y-auto flex items-center justify-center px-4 py-8">
          <motion.div className="panel max-w-lg w-full p-6 sm:p-8" initial={{ scale: 0.7 }} animate={{ scale: 1 }}>
            <div className="level-chip mx-auto">{result.outcome === "win" ? "MISSION SUCCESS" : "MISSION FAILED"}</div>
            <div className="text-center font-display text-5xl text-navy mt-3" data-testid="final-score">{result.score}</div>
            <p className="text-center font-bold text-navy/70">points for cadet {result.name}</p>
            <p className="text-center text-sm font-bold text-navy/70 mt-4" data-testid="final-creators">Created by {CREATORS.join(", ")}</p>
            <h3 className="font-display text-navy mt-6 flex items-center gap-2"><Trophy className="text-orange" /> Top cadets</h3>
            <ol className="mt-2 space-y-1" data-testid="leaderboard">
              {board.map((s, i) => (
                <li key={s.id} className="flex justify-between font-bold text-navy border-b-2 border-dashed border-navy/20 py-1">
                  <span>{i + 1}. {s.name} <span className="text-xs text-orange">{s.outcome === "win" ? "LANDED" : "BOOM"}</span></span><span>{s.score}</span>
                </li>
              ))}
            </ol>
            <Btn data-testid="play-again-btn" className="mt-6 w-full justify-center" onClick={onRestart}><RotateCcw size={18} /> Play again</Btn>
          </motion.div>
        </div>
      )}
    </Scene>
  );
}
