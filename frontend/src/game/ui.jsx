import { motion, AnimatePresence } from "framer-motion";

export const Btn = ({ children, variant = "orange", className = "", ...p }) => (
  <button className={`toon-btn toon-btn-${variant} ${className}`} {...p}>{children}</button>
);

export const Scene = ({ bg, children, className = "", testid }) => (
  <div data-testid={testid} className={`scene ${className}`} style={bg ? { backgroundImage: `url(${bg})` } : undefined}>
    {children}
  </div>
);

export const BobSays = ({ text, className = "", testid = "bob-says" }) => (
  <div className={`flex items-end gap-2 ${className}`}>
    <motion.img src="/game/bob.png" alt="B.O.B." className="w-20 sm:w-28 drop-shadow-xl bob-float"
      initial={{ scale: 0.6 }} animate={{ scale: 1 }} />
    <AnimatePresence mode="wait">
      {text && (
        <motion.div key={text} data-testid={testid} className="bubble bubble-left max-w-xs sm:max-w-sm"
          initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const LevelCard = ({ n, title, subtitle, onStart }) => (
  <Scene bg="/game/bg-space.jpg" testid={`level-${n}-intro`} className="flex items-center justify-center">
    <motion.div className="panel text-center max-w-xl mx-4 p-8 sm:p-12"
      initial={{ scale: 0.4, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.5 }}>
      <div className="level-chip mx-auto">LEVEL {n}</div>
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mt-4 text-navy">{title}</h1>
      <p className="text-base md:text-lg mt-4 text-navy/80 font-semibold">{subtitle}</p>
      <Btn data-testid={`level-${n}-start-btn`} className="mt-8" onClick={onStart}>Let's go!</Btn>
    </motion.div>
  </Scene>
);
