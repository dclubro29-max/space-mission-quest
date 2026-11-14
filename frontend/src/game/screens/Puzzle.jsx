import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Shuffle } from "lucide-react";
import { Scene, Btn, BobSays } from "../ui";
import { JOKES, pick } from "../data";
import { sfx } from "../sound";

const COLS = 4, ROWS = 3, N = COLS * ROWS;
const scramble = () => {
  let a;
  do a = [...Array(N).keys()].sort(() => Math.random() - 0.5); while (a.some((v, i) => v === i) && a.filter((v, i) => v === i).length > 2);
  return a;
};
const pieceStyle = (id) => ({
  backgroundImage: "url(/game/puzzle.png)",
  backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
  backgroundPosition: `${((id % COLS) / (COLS - 1)) * 100}% ${(Math.floor(id / COLS) / (ROWS - 1)) * 100}%`,
});

export default function Puzzle({ onDone }) {
  const [order, setOrder] = useState(scramble);
  const [sel, setSel] = useState(null);
  const [drag, setDrag] = useState(null);
  const [moves, setMoves] = useState(0);
  const [peek, setPeek] = useState(false);
  const [bob, setBob] = useState("Swap the pieces to rebuild the mission poster. Tap one piece, then another. Or drag them!");
  const solved = order.every((v, i) => v === i);

  useEffect(() => {
    if (solved) { sfx.fanfare(); setBob("Puzzle complete! Blueprint restored. I'll try not to sneeze on it again."); }
    else if (moves > 0 && moves % 6 === 0) setBob(pick(JOKES.puzzle));
  }, [moves, solved]);

  const swap = (a, b) => {
    if (a === b) return;
    const o = [...order];
    [o[a], o[b]] = [o[b], o[a]];
    setOrder(o);
    setMoves((m) => m + 1);
    sfx.select();
  };
  const tap = (i) => {
    if (solved) return;
    if (sel === null) { setSel(i); sfx.click(); } else { swap(sel, i); setSel(null); }
  };

  return (
    <Scene bg="/game/bg-training.jpg" testid="puzzle-screen" className="overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col items-center gap-4">
        <div className="panel w-full p-4 flex flex-wrap justify-between items-center gap-3">
          <h2 className="font-display text-lg md:text-xl text-navy">Level 1 · Mission Puzzle</h2>
          <div className="flex gap-2 items-center">
            <span className="level-chip" data-testid="puzzle-moves">Moves: {moves}</span>
            <button data-testid="puzzle-peek-btn" className="toon-btn toon-btn-navy !py-2 !px-3 text-sm"
              onMouseDown={() => setPeek(true)} onMouseUp={() => setPeek(false)} onMouseLeave={() => setPeek(false)}
              onTouchStart={() => setPeek(true)} onTouchEnd={() => setPeek(false)}><Eye size={16} /> Peek</button>
            <button data-testid="puzzle-shuffle-btn" className="toon-btn toon-btn-navy !py-2 !px-3 text-sm"
              onClick={() => { setOrder(scramble()); setSel(null); }}><Shuffle size={16} /></button>
          </div>
        </div>
        <div className="puzzle-board" data-testid="puzzle-board">
          {peek || solved ? (
            <motion.img src="/game/puzzle.png" alt="Mission poster" className="w-full h-full object-cover col-span-4 row-span-3"
              initial={{ opacity: 0.4 }} animate={{ opacity: 1, scale: solved ? [1, 1.03, 1] : 1 }} />
          ) : order.map((id, i) => (
            <div key={i} data-testid={`puzzle-piece-${i}`} draggable
              onClick={() => tap(i)} onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag !== null) swap(drag, i); setDrag(null); setSel(null); }}
              className={`piece ${sel === i ? "piece-sel" : ""} ${id === i ? "piece-ok" : ""}`} style={pieceStyle(id)} />
          ))}
        </div>
        <div className="w-full flex flex-wrap justify-between items-end gap-4">
          <BobSays text={bob} testid="puzzle-bob-text" />
          {solved && <Btn data-testid="puzzle-continue-btn" onClick={() => onDone(moves)}>Next level</Btn>}
        </div>
      </div>
    </Scene>
  );
}
