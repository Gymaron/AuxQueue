export function AuxCordLogo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left connector */}
      <circle cx="40" cy="100" r="20" fill="#1DB954" />
      <circle cx="40" cy="100" r="12" fill="#121212" />
      <line x1="40" y1="85" x2="40" y2="115" stroke="#1DB954" strokeWidth="3" />
      <line x1="35" y1="100" x2="45" y2="100" stroke="#1DB954" strokeWidth="3" />
      
      {/* Cable */}
      <path
        d="M 60 100 Q 80 60, 100 80 T 140 100"
        stroke="#535353"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 60 100 Q 80 60, 100 80 T 140 100"
        stroke="#282828"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Right connector */}
      <circle cx="160" cy="100" r="20" fill="#1DB954" />
      <circle cx="160" cy="100" r="12" fill="#121212" />
      <line x1="160" y1="85" x2="160" y2="115" stroke="#1DB954" strokeWidth="3" />
      <line x1="155" y1="100" x2="165" y2="100" stroke="#1DB954" strokeWidth="3" />
      
      {/* Musical note accent */}
      <circle cx="100" cy="50" r="8" fill="#1ed760" opacity="0.8" />
      <rect x="107" y="50" width="3" height="30" fill="#1ed760" opacity="0.8" />
      <path d="M 107 50 L 120 45 L 120 55 Z" fill="#1ed760" opacity="0.8" />
    </svg>
  );
}
