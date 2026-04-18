export default function CharCounter({ value, max }) {
  const len = value.length;
  const pct = len / max;
  const color = pct >= 1 ? "#ef4444" : pct >= 0.85 ? "#f59e0b" : "var(--text-dim)";
  return (
    <span className="font-mono text-[10px]" style={{ color }}>{len}/{max}</span>
  );
}
