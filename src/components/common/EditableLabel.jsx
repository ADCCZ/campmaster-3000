import { useState } from "react";
import { Check, Pencil } from "lucide-react";

export default function EditableLabel({ value, onChange, className = "", style = {}, disabled = false }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);

  function confirm() {
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed);
    setEditing(false);
  }

  if (disabled) {
    return <span className={`truncate flex-1 ${className}`} style={style}>{value}</span>;
  }

  if (editing) {
    return (
      <span className="flex items-center gap-1 flex-1 min-w-0">
        <input
          className="px-1 py-0 font-mono text-xs flex-1 min-w-0 focus:outline-none"
          style={{
            border: "1px solid var(--border-bright)",
            borderRadius: 4,
            background: "var(--bg-card)",
            color: "var(--text-primary)",
          }}
          value={draft}
          autoFocus
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter")  confirm();
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={confirm}
        />
        <button
          className="flex-shrink-0"
          style={{ color: "var(--green)" }}
          onMouseDown={e => e.preventDefault()}
          onClick={confirm}
        >
          <Check size={10} />
        </button>
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 group flex-1 min-w-0 ${className}`} style={style}>
      <span className="truncate">{value}</span>
      <button
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
        style={{ color: "var(--text-dim)" }}
        onClick={e => { e.stopPropagation(); setDraft(value); setEditing(true); }}
      >
        <Pencil size={9} />
      </button>
    </span>
  );
}
