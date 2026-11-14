import {
  Flame, Wind, RadioTower, Shield, Sun, Compass, CarFront, PersonStanding, Fuel, AirVent,
  Cpu, FlaskConical, Thermometer, PlaneLanding, Droplets, Umbrella, Lightbulb,
} from "lucide-react";

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export const chars = (name) => ({
  bob: { name: "B.O.B.", img: "/game/bob.png", color: "#ff7a1a", h: "34vh" },
  mentor: { name: "Commander Rex", img: "/game/mentor.png", color: "#14213d", h: "56vh" },
  alex: { name: name || "Alex", img: "/game/alex.png", color: "#2a9d8f", h: "50vh" },
  astronaut: { name: "Captain Nova", img: "/game/astronaut.png", color: "#3a86ff", h: "44vh" },
});

export const COLONY = [
  { name: "Andreea Vladu", img: "/game/andreea.png" },
  { name: "Maria Cojocaru", img: "/game/maria.png" },
  { name: "Ionuț Ivanici", img: "/game/ionut.png" },
  { name: "Queen Gratziella", img: "/game/queen.png", queen: true },
  { name: "Goran Giuchici", img: "/game/goran.png" },
  { name: "Patrick Drăghina", img: "/game/patrick.png" },
];

export const CREATORS = ["Andreea Vladu", "Maria Cojocaru", "Ionuț Ivanici", "Goran Giuchici", "Patrick Drăghina"];

export const COMPONENTS = {
  engines: { name: "Rocket Engine", icon: Flame, info: "Burns fuel and pushes hot gas out the back to create thrust. No thrust, no trip!", fact: "A big rocket engine can make more power than 20 jet planes!" },
  life: { name: "Life Support System", icon: Wind, info: "Gives the crew oxygen to breathe and keeps the cabin air safe.", fact: "One astronaut needs about 0.8 kg of oxygen every day." },
  antenna: { name: "Radio Antenna", icon: RadioTower, info: "Sends and receives messages between the spacecraft and Earth.", fact: "A signal from Mars can take up to 22 minutes to reach Earth!" },
  heatshield: { name: "Heat Shield", icon: Shield, info: "Protects the capsule from burning hot temperatures when entering an atmosphere.", fact: "Re-entry can heat a shield to over 1,600°C." },
  solar: { name: "Solar Panels", icon: Sun, info: "Turn sunlight into electricity that powers every system on board.", fact: "Near Mars, sunlight is less than half as strong as on Earth." },
  navigation: { name: "Navigation System", icon: Compass, info: "Works out where the ship is and which way it needs to go.", fact: "Spacecraft use the stars as a map to find their way!" },
  rover: { name: "Rover", icon: CarFront, info: "A robotic car that drives around and explores the surface of Mars.", fact: "NASA's Perseverance rover is about the size of a small car." },
  spacesuit: { name: "Spacesuit", icon: PersonStanding, info: "A personal mini-spaceship that protects an astronaut outside the ship.", fact: "A NASA spacesuit weighs about 130 kg on Earth!" },
  fuel: { name: "Fuel Tank", icon: Fuel, info: "Stores the fuel the engines burn. More mass means more fuel needed!", fact: "Most of a rocket's weight at launch is just fuel." },
  air: { name: "Air Purification System", icon: AirVent, info: "Scrubs carbon dioxide (CO2) out of the air the crew breathes out.", fact: "Too much CO2 makes astronauts sleepy and gives them headaches." },
  computer: { name: "Onboard Computer", icon: Cpu, info: "The ship's brain. Controls automatic functions like autopilot.", fact: "The Apollo computer had less power than a modern calculator!" },
  instruments: { name: "Science Instruments", icon: FlaskConical, info: "Cameras, sensors and tools that run experiments and collect data on Mars.", fact: "Better instruments = more science, but also more mass and power." },
  thermal: { name: "Thermal Control System", icon: Thermometer, info: "Keeps the inside of the ship not too hot, not too cold.", fact: "In space, the sunny side can be +120°C and the shady side -150°C!" },
  landing: { name: "Landing System", icon: PlaneLanding, info: "Legs, thrusters and parachutes that help a module touch down gently.", fact: "Landing on Mars is called the '7 minutes of terror'." },
  water: { name: "Water Treatment System", icon: Droplets, info: "Cleans and recycles water so astronauts can drink it safely.", fact: "On the ISS, astronauts recycle about 98% of their water!" },
  parachute: { name: "Parachute", icon: Umbrella, info: "Slows a capsule down as it falls through an atmosphere.", fact: "The Perseverance parachute was 21.5 m wide." },
  lights: { name: "Lighting System", icon: Lightbulb, info: "Lights up the cabin so the crew can see.", fact: "Special lights help astronauts keep a normal sleep schedule." },
};

export const TRAINING_KEYS = ["engines", "fuel", "life", "air", "water", "solar", "antenna", "navigation", "computer", "thermal", "heatshield", "landing", "spacesuit", "rover", "instruments"];

export const QUIZ = [
  { q: "Which component pushes the rocket into space?", a: ["Rocket engines", "Solar panels", "Antennas", "Video cameras"] },
  { q: "Which system provides oxygen to the astronauts?", a: ["Life support system", "Navigation system", "Radar", "Communications system"] },
  { q: "Which component allows communication with Earth?", a: ["Radio antenna", "Fuel tank", "Heat shield", "Main engine"] },
  { q: "What protects the spacecraft from extreme temperatures when re-entering the atmosphere?", a: ["Heat shield", "Solar panels", "Antenna", "Computer"] },
  { q: "Which equipment can produce electricity from sunlight?", a: ["Solar panels", "Parachute", "Water tank", "Radar"] },
  { q: "Which system helps the spacecraft determine its position and route?", a: ["Navigation system", "Lighting system", "Water filtration system", "Medical system"] },
  { q: "Which vehicle is used to explore the surface of Mars?", a: ["Rover", "Communications satellite", "Orbital module", "Return capsule"] },
  { q: "Which equipment protects an astronaut outside the spacecraft?", a: ["Spacesuit", "Training uniform", "Regular overalls", "Safety vest"] },
  { q: "Which component stores the rocket's fuel?", a: ["Fuel tank", "Radio antenna", "Solar panel", "Onboard computer"] },
  { q: "Which system removes carbon dioxide from the cabin air?", a: ["Air purification system", "Propulsion system", "Landing system", "Navigation system"] },
  { q: "Which component controls the automatic functions of the spacecraft?", a: ["Onboard computer", "Heat shield", "Oxygen tank", "Parachute"] },
  { q: "Which equipment allows scientific experiments on Mars?", a: ["Scientific instruments", "Launch engines", "TV antenna", "Lighting system"] },
  { q: "Which system keeps the right temperature inside the spacecraft?", a: ["Thermal control system", "Communications system", "Radar", "Propulsion system"] },
  { q: "Which component helps a module land safely on Mars?", a: ["Landing system", "Lighting panels", "Main antenna", "Audio system"] },
  { q: "Which equipment lets astronauts drink water safely?", a: ["Water treatment system", "Radar system", "Auxiliary engine", "Heat shield"] },
];
export const QUIZ_COUNT = 10;
export const QUIZ_PASS = 7;

export const MALFUNCTIONS = [
  { alert: "ENGINE THRUST DROPPING", text: "Engine #2 is coughing like a sick dragon. We're losing speed!", correct: "engines", options: ["engines", "solar", "parachute", "water"], bob: "Engine fixed. You used the right wrench. I'm almost proud. Almost." },
  { alert: "POWER FAILURE", text: "A solar storm fried the power grid. Lights are flickering and batteries are draining fast!", correct: "solar", options: ["solar", "heatshield", "rover", "antenna"], bob: "Power is back! I can feel my circuits again. Not that I missed them." },
  { alert: "SIGNAL LOST", text: "Mission Control can't hear us. Earth is officially ghosting us!", correct: "antenna", options: ["antenna", "fuel", "spacesuit", "lights"], bob: "Earth says hi. Also they say: stop calling so much." },
  { alert: "CO2 LEVELS RISING", text: "The cabin smells like old socks and carbon dioxide levels are climbing!", correct: "air", options: ["air", "engines", "landing", "instruments"], bob: "Fresh air! Well, recycled air. Recycled sock air. Still better." },
  { alert: "OFF COURSE", text: "We're drifting 3,000 km off course. At this rate we'll land on Jupiter!", correct: "navigation", options: ["navigation", "water", "lights", "rover"], bob: "Course corrected. Jupiter will have to wait for someone dumber." },
  { alert: "CABIN FREEZING", text: "The heaters stopped working. It's -40°C in here and my bolts are turning into ice cubes!", correct: "thermal", options: ["thermal", "antenna", "parachute", "fuel"], bob: "Toasty! Okay, room temperature. For a robot that is basically a spa." },
  { alert: "AUTOPILOT CRASHED", text: "The onboard computer froze and is showing a spinning wheel. Autopilot is offline!", correct: "computer", options: ["computer", "heatshield", "water", "solar"], bob: "Computer rebooted. Have you tried turning it off and on again? You did. Wow." },
  { alert: "LANDING GEAR STUCK", text: "Mars is right below us, but the landing legs won't come out!", correct: "landing", options: ["landing", "antenna", "instruments", "lights"], bob: "Legs out! Brace yourself for the 7 minutes of terror..." },
];

export const JOKES = {
  door: "It's a door. A revolutionary invention. YOU OPEN IT!",
  passed: "CONGRATULATIONS! YOU PASSED! I'm requesting a recount.",
  inventory: "17 ROCKS, 3 POTATOES AND NO OXYGEN?! WHAT'S THE PLAN?! THROW POTATOES AT SPACE?!",
  brag: "YOU LOST A FIGHT AGAINST A DOOR. LET'S NOT GET CARRIED AWAY.",
  bragNoBonk: "YOU OPENED ONE DOOR CORRECTLY. LET'S NOT GET CARRIED AWAY.",
  quizRight: [
    "Correct! Don't let it go to your helmet.",
    "Right answer. I'm suspicious.",
    "Correct. Who are you and what did you do with the cadet?",
    "Nailed it. Even my sarcasm module is impressed.",
  ],
  quizWrong: [
    "Wrong! But confidently wrong, which is my favorite kind.",
    "Were you listening in training, or just staring at my beautiful face?",
    "Incorrect. I'm writing this in my 'Humans Being Humans' notebook.",
    "Nope. Even the potatoes knew that one.",
  ],
  repairWrong: [
    "That's not even CLOSE. I've met toasters with better instincts.",
    "Bold choice. Wrong, but bold.",
    "Did you pick that because the icon looked pretty?",
    "The rocket says 'ouch'. I say 'why'.",
    "Ah yes, fixing a problem by creating a new one. Classic human.",
  ],
  puzzle: [
    "Tip: the rocket points UP. Usually.",
    "Those pieces won't swap themselves. Trust me, I asked.",
    "Take your time. Mars isn't going anywhere. Literally. It's a planet.",
    "I could solve this in 0.3 seconds. But watching you is more fun.",
  ],
};
