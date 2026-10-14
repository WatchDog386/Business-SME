/**
 * The picture on the "Invalid Details" popup: a subscriber record being checked
 * against the records and not found. Drawn in the brand's teal and lime so it
 * sits with the rest of the art rather than borrowing another app's.
 */
export function InvalidDetailsArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 180" fill="none" role="img" aria-label="Details not found" className={className}>
      {/* Records cabinet */}
      <rect x="8" y="28" width="86" height="132" rx="10" fill="#1D2A33" />
      <rect x="8" y="28" width="86" height="132" rx="10" stroke="#3A8F91" strokeOpacity="0.5" strokeWidth="1.5" />
      {[0, 1, 2, 3].map((row) => (
        <g key={row}>
          <rect x="18" y={40 + row * 30} width="66" height="22" rx="5" fill="#26343E" />
          <rect x="18" y={40 + row * 30} width="66" height="22" rx="5" stroke="#3A8F91" strokeOpacity="0.35" strokeWidth="1.2" />
          <rect x="24" y={47 + row * 30} width="34" height="8" rx="4" fill="#4C5C68" />
          <circle cx="74" cy={51 + row * 30} r="3.5" fill={row === 1 ? '#D9534F' : '#7CB82F'} />
        </g>
      ))}

      {/* The slip that did not match, lifted out of the cabinet and crossed out */}
      <g transform="rotate(-8 176 44)">
        <rect x="130" y="24" width="92" height="46" rx="6" fill="#F4F7F4" />
        <rect x="140" y="34" width="26" height="26" rx="4" fill="#D6E0DE" />
        <circle cx="153" cy="43" r="5" fill="#9FB0B4" />
        <path d="M144 58c2.5-4.5 5.5-6.5 9-6.5s6.5 2 9 6.5" fill="#9FB0B4" />
        <rect x="172" y="36" width="40" height="6" rx="3" fill="#B9C6C8" />
        <rect x="172" y="47" width="30" height="6" rx="3" fill="#D3DDDE" />
        <g stroke="#D9534F" strokeWidth="4.5" strokeLinecap="round">
          <path d="M158 34 L190 60" />
          <path d="M190 34 L158 60" />
        </g>
      </g>

      {/* Cable into the cabinet, matching the record that failed */}
      <path d="M104 150c26 0 26-26 52-26" stroke="#3A8F91" strokeOpacity="0.7" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 7" />

      {/* Magnifier */}
      <circle cx="196" cy="112" r="26" fill="#101418" fillOpacity="0.75" stroke="#7CB82F" strokeWidth="3.5" />
      <path d="M215 131 L232 148" stroke="#7CB82F" strokeWidth="5" strokeLinecap="round" />
      <path d="M186 112h20" stroke="#D9534F" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
