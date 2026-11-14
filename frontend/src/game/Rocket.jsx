export const Rocket = ({ flame = true, className = "", broken = false }) => (
  <svg viewBox="0 0 120 240" className={className} aria-label="rocket">
    {flame && (
      <g className="flame">
        <path d="M42 190 Q60 250 78 190 Z" fill="#ffc93c" stroke="#111" strokeWidth="3" />
        <path d="M50 190 Q60 225 70 190 Z" fill="#ff7a1a" />
      </g>
    )}
    <path d="M30 150 L10 195 L38 185 Z" fill="#ff7a1a" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
    <path d="M90 150 L110 195 L82 185 Z" fill="#ff7a1a" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
    <path d="M60 8 C95 40 95 120 88 190 L32 190 C25 120 25 40 60 8 Z" fill={broken ? "#ffd6d6" : "#fff4e0"} stroke="#111" strokeWidth="4" />
    <path d="M60 8 C76 22 84 40 87 58 L33 58 C36 40 44 22 60 8 Z" fill="#ff7a1a" stroke="#111" strokeWidth="4" />
    <circle cx="60" cy="100" r="17" fill="#3a86ff" stroke="#111" strokeWidth="4" />
    <circle cx="54" cy="94" r="5" fill="#fff" opacity="0.8" />
    <rect x="40" y="190" width="40" height="10" rx="2" fill="#6b7280" stroke="#111" strokeWidth="4" />
    <text x="60" y="160" textAnchor="middle" fontFamily="Bungee" fontSize="11" fill="#14213d">G-1</text>
  </svg>
);
