import { JOKES } from "./data";

export const SCRIPTS = {
  intro: (n) => ({
    bg: "/game/bg-training.jpg",
    cast: ["bob"],
    lines: [
      { who: "bob", text: "Beep boop. Oh look, a human. Hello! I am B.O.B., the Brilliant Operational Bot." },
      { who: "bob", text: "Some people say B.O.B. means 'Bunch Of Bolts'. Those people are no longer allowed near my charging station." },
      { who: "bob", text: `Welcome to the NASA Space Academy, cadet ${n}! The year is 2049 and humans finally built a colony on Mars.` },
      { who: "bob", text: "It's ruled by the magnificent Queen Gratziella. The colony needs a new crew member. And by some cosmic accident... they picked YOU." },
      { who: "bob", text: "Your mission: finish training, rebuild the mission plan, pass the exam and fly a rocket to Mars. Without exploding. Easy. Probably." },
      { who: "bob", text: "Your trainer is waiting inside. Follow me. And try not to embarrass us both." },
    ],
  }),
  training: (n) => ({
    bg: "/game/bg-training.jpg",
    cast: ["alex", "mentor", "bob"],
    lines: [
      { who: "mentor", text: `Welcome, ${n}! I'm Commander Rex, your mentor. Ignore the robot. He has 100% sarcasm and 0% manners.` },
      { who: "bob", text: "Correction: 110% sarcasm. I got an upgrade." },
      { who: "alex", text: "Hi Commander! I'm ready to fly to Mars!" },
      { who: "mentor", text: "First you need to know your spacecraft. Every part has a job: engines, power, air, water, communication. If one fails, the whole mission is in trouble." },
      { who: "mentor", text: "Real mission engineers juggle mass, power and budget. Add something heavy and you need more fuel. Everything is connected!" },
      { who: "bob", text: "Like me and coffee. Except I don't drink coffee. I drink electricity. Please continue." },
      { who: "mentor", text: "Study these training cards carefully. There WILL be an exam." },
      { who: "bob", text: "Spoiler alert: there's always an exam." },
    ],
  }),
  prePuzzle: () => ({
    bg: "/game/bg-training.jpg",
    cast: ["alex", "mentor", "bob"],
    lines: [
      { who: "mentor", text: "Great job! Every mission starts with a plan. Unfortunately, our mission blueprint got... slightly shredded." },
      { who: "bob", text: "I sneezed. Robots don't sneeze. And yet, here we are." },
      { who: "mentor", text: "Put the mission poster back together and you'll pass Level 1!" },
    ],
  }),
  preQuiz: () => ({
    bg: "/game/bg-training.jpg",
    cast: ["alex", "mentor", "bob"],
    lines: [
      { who: "mentor", text: "Blueprint restored! Now let's see how much you remember from training." },
      { who: "bob", text: "Level 2: The Exam. 10 questions. You need 7 right answers to fly. No pressure." },
      { who: "bob", text: "Well, except for the pressure of space. Which is zero. Ha. Space joke. You may laugh now." },
    ],
  }),
  postQuiz: (n, ctx) => ({
    bg: "/game/bg-training.jpg",
    cast: ["alex", "mentor", "bob"],
    lines: [
      { who: "bob", text: JOKES.passed },
      { who: "mentor", text: `Excellent work, ${n}! You are officially cleared for launch!` },
      { who: "alex", text: "Did you hear that, B.O.B.? I'm an EXCELLENT astronaut!" },
      { who: "bob", text: ctx.bonks > 0 ? JOKES.brag : JOKES.bragNoBonk },
      { who: "mentor", text: "Head to the launch pad. Check your cargo before takeoff and pack wisely!" },
    ],
  }),
  preLaunch: (n) => ({
    bg: "/game/bg-launchpad.jpg",
    cast: ["alex", "astronaut", "bob"],
    lines: [
      { who: "astronaut", text: `Captain Nova here! I'll be your co-pilot, ${n}. Cargo is loaded and fuel tanks are full.` },
      { who: "astronaut", text: "Space is full of surprises. If something breaks, you'll have to pick the right part to fix it. Fast!" },
      { who: "bob", text: "Three mistakes and we go BOOM. I just want you to know I've already written my farewell speech." },
      { who: "alex", text: "We've got this. Let's go to Mars!" },
    ],
  }),
};
