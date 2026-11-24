import { useCallback, useMemo, useState } from "react";
import "@/App.css";
import { Volume2, VolumeX } from "lucide-react";
import Dialogue from "@/game/Dialogue";
import { LevelCard } from "@/game/ui";
import { chars } from "@/game/data";
import { SCRIPTS } from "@/game/story";
import { setMuted } from "@/game/sound";
import Title from "@/game/screens/Title";
import DoorGag from "@/game/screens/DoorGag";
import Training from "@/game/screens/Training";
import Puzzle from "@/game/screens/Puzzle";
import Quiz from "@/game/screens/Quiz";
import Cargo from "@/game/screens/Cargo";
import Launch from "@/game/screens/Launch";
import Repair from "@/game/screens/Repair";
import WinEnding from "@/game/screens/WinEnding";
import LoseEnding from "@/game/screens/LoseEnding";
import Explore from "@/game/screens/Explore";
import Colony from "@/game/screens/Colony";
import Credits from "@/game/screens/Credits";
import MarsGame from "@/mars/MarsGame";

const INITIAL = { stage: "title", name: "Alex", bonks: 0, moves: 0, quiz: 0, repair: null };

function App() {
  const [g, setG] = useState(INITIAL);
  const [mute, setMute] = useState(false);
  const go = useCallback((stage, extra = {}) => setG((s) => ({ ...s, ...extra, stage })), []);
  const cast = useMemo(() => chars(g.name), [g.name]);
  const dlg = (key, nextStage) => (
    <Dialogue key={key} testid={`dialogue-${key}`} scene={SCRIPTS[key](g.name, g)} characters={cast} onDone={() => go(nextStage)} />
  );

  const result = () => {
    const r = g.repair || { win: false, fixed: 0, lives: 0 };
    const score = g.quiz * 100 + Math.max(0, 600 - g.moves * 10) + r.fixed * 150 + r.lives * 200 + (r.win ? 1000 : 0);
    return { name: g.name.slice(0, 24), score, outcome: r.win ? "win" : "lose", quiz_correct: g.quiz, lives_left: r.lives };
  };

  const screens = {
    title: () => <Title onStart={(name) => go("intro", { ...INITIAL, name })} onExplore={(name) => go("mars", { name })} />,
    mars: () => <MarsGame name={g.name} onExit={() => go("title")} />,
    intro: () => dlg("intro", "door"),
    door: () => <DoorGag onDone={(bonks) => go("training", { bonks })} />,
    training: () => dlg("training", "cards"),
    cards: () => <Training onDone={() => go("prePuzzle")} />,
    prePuzzle: () => dlg("prePuzzle", "lvl1"),
    lvl1: () => <LevelCard n={1} title="Mission Puzzle" subtitle="Put the pieces of the mission poster back together." onStart={() => go("puzzle")} />,
    puzzle: () => <Puzzle onDone={(moves) => go("preQuiz", { moves })} />,
    preQuiz: () => dlg("preQuiz", "lvl2"),
    lvl2: () => <LevelCard n={2} title="The Exam" subtitle="Answer at least 7 of 10 questions about your spacecraft." onStart={() => go("quiz")} />,
    quiz: () => <Quiz onDone={(quiz) => go("postQuiz", { quiz })} />,
    postQuiz: () => dlg("postQuiz", "cargo"),
    cargo: () => <Cargo onDone={() => go("preLaunch")} />,
    preLaunch: () => dlg("preLaunch", "launch"),
    launch: () => <Launch onDone={() => go("lvl3")} />,
    lvl3: () => <LevelCard n={3} title="Problems & Solutions" subtitle="Malfunctions ahead! Pick the right component to repair. 3 mistakes and... BOOM." onStart={() => go("repair")} />,
    repair: () => <Repair onDone={(repair) => { if (repair.win) localStorage.setItem("explore-mars-unlocked", "1"); go(repair.win ? "win" : "lose", { repair }); }} />,
    win: () => <WinEnding onDone={() => go("explore")} />,
    explore: () => <Explore name={g.name} onDone={() => go("colony")} />,
    lose: () => <LoseEnding name={g.name} onDone={() => go("colony")} />,
    colony: () => <Colony win={g.repair?.win} name={g.name} onDone={() => go("credits")} />,
    credits: () => <Credits result={result()} onRestart={() => go("title", INITIAL)} onExplore={() => go("mars")} />,
  };

  return (
    <div className="App" data-testid="game-root">
      <button data-testid="mute-toggle-btn" className="mute-btn" aria-label="Toggle sound"
        onClick={() => { setMuted(!mute); setMute(!mute); }}>
        {mute ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
      {screens[g.stage]()}
    </div>
  );
}

export default App;
