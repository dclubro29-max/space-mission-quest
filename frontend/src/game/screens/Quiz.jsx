import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, RotateCcw } from "lucide-react";
import { Scene, Btn, BobSays } from "../ui";
import { QUIZ, QUIZ_COUNT, QUIZ_PASS, JOKES, pick, shuffle } from "../data";
import { sfx } from "../sound";

const build = () => shuffle(QUIZ).slice(0, QUIZ_COUNT).map((x) => ({ q: x.q, correct: x.a[0], options: shuffle(x.a) }));

export default function Quiz({ onDone }) {
  const [round, setRound] = useState(0);
  const qs = useMemo(build, [round]);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [bob, setBob] = useState("Pick the right answer. Or don't. I'm a robot, not a cop.");
  const [finished, setFinished] = useState(false);
  const q = qs[i];

  const answer = (opt) => {
    if (chosen) return;
    setChosen(opt);
    if (opt === q.correct) { sfx.success(); setScore((s) => s + 1); setBob(pick(JOKES.quizRight)); }
    else { sfx.fail(); setBob(pick(JOKES.quizWrong)); }
  };
  const next = () => {
    sfx.click();
    if (i < qs.length - 1) { setI(i + 1); setChosen(null); return; }
    setFinished(true);
    if (score >= QUIZ_PASS) sfx.fanfare(); else sfx.sad();
  };
  const retry = () => { setRound(round + 1); setI(0); setChosen(null); setScore(0); setFinished(false); setBob("Round two. I believe in you. Statistically, I shouldn't."); };

  if (finished) {
    const pass = score >= QUIZ_PASS;
    return (
      <Scene bg="/game/bg-training.jpg" testid="quiz-result-screen" className="flex items-center justify-center px-4">
        <motion.div className="panel max-w-lg w-full p-8 text-center" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
          <div className="level-chip mx-auto">{pass ? "EXAM PASSED" : "EXAM FAILED"}</div>
          <div className="font-display text-6xl text-navy mt-4" data-testid="quiz-final-score">{score}/{QUIZ_COUNT}</div>
          <BobSays className="justify-center mt-6" testid="quiz-result-bob-text"
            text={pass ? "Hmm. Fine. You passed. I'll allow it." : `${score} out of ${QUIZ_COUNT}?! My vacuum cleaner scores better and it doesn't even have a brain. Let's try again, I'll pretend this never happened.`} />
          {pass ? <Btn data-testid="quiz-continue-btn" className="mt-6" onClick={() => onDone(score)}>Continue</Btn>
            : <Btn data-testid="quiz-retry-btn" className="mt-6" onClick={retry}><RotateCcw size={18} /> Retry exam</Btn>}
        </motion.div>
      </Scene>
    );
  }

  return (
    <Scene bg="/game/bg-training.jpg" testid="quiz-screen" className="overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
        <div className="panel p-4 flex justify-between items-center flex-wrap gap-3">
          <h2 className="font-display text-lg md:text-xl text-navy">Level 2 · The Exam</h2>
          <div className="flex gap-1.5">
            {qs.map((_, k) => <span key={k} className={`dot ${k < i ? "dot-done" : k === i ? "dot-now" : ""}`} />)}
          </div>
          <span className="level-chip" data-testid="quiz-score">Score {score}</span>
        </div>
        <motion.div key={`${round}-${i}`} className="panel p-6 sm:p-8" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="font-display text-sm text-orange">Question {i + 1} of {QUIZ_COUNT}</div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-navy mt-2" data-testid="quiz-question">{q.q}</h3>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {q.options.map((o, k) => {
              const state = chosen && (o === q.correct ? "ans-right" : o === chosen ? "ans-wrong" : "ans-dim");
              return (
                <button key={o} data-testid={`quiz-option-${k}`} onClick={() => answer(o)} className={`answer ${state || ""}`}>
                  <span className="ans-letter">{"ABCD"[k]}</span>
                  <span className="flex-1 text-left">{o}</span>
                  {chosen && o === q.correct && <Check />}
                  {chosen && o === chosen && o !== q.correct && <X />}
                </button>
              );
            })}
          </div>
        </motion.div>
        <div className="flex flex-wrap justify-between items-end gap-4">
          <BobSays text={bob} testid="quiz-bob-text" />
          {chosen && <Btn data-testid="quiz-next-btn" onClick={next}>{i < qs.length - 1 ? "Next question" : "See results"}</Btn>}
        </div>
      </div>
    </Scene>
  );
}
