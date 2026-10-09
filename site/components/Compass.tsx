// The studio's mark: the SafariOS compass in a gold tile (as on the film's end card).
export default function Compass({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="31" fill="none" stroke="#0e2a1f" strokeWidth="8" />
      <path d="M50 26 L58 50 L50 74 L42 50 Z" fill="#0e2a1f" transform="rotate(35 50 50)" />
    </svg>
  );
}
