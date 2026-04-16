import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

/**
 * Themed select that renders its dropdown via a portal so it's never
 * clipped by overflow:hidden ancestors and never triggers the browser's
 * native-select blur effect on the rest of the page.
 *
 * options: array of { value, label } or plain strings
 * placeholder: optional first "empty" option (value = "")
 * height: explicit px height for the trigger button
 */
export default function CustomSelect({
  value, onChange, options = [], placeholder,
  disabled, height, style, className = "",
}) {
  const [open, setOpen]     = useState(false);
  const [pos,  setPos]      = useState({ top: 0, left: 0, width: 0 });
  const triggerRef          = useRef(null);
  const dropRef             = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (
        !triggerRef.current?.contains(e.target) &&
        !dropRef.current?.contains(e.target)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleToggle() {
    if (disabled) return;
    if (!open) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: r.width });
    }
    setOpen(o => !o);
  }

  const selected = options.find(o =>
    String(typeof o === "string" ? o : o.value) === String(value)
  );
  const displayLabel = selected
    ? (typeof selected === "string" ? selected : selected.label)
    : (placeholder ?? "—");

  return (
    <div ref={triggerRef} className={`relative ${className}`} style={style}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className="cm-select w-full flex items-center gap-2"
        style={{
          ...(height ? { height } : {}),
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          backgroundImage: "none",
          paddingRight: 10,
        }}
      >
        <span className="flex-1 truncate">{displayLabel}</span>
        <ChevronDown
          size={13}
          className="flex-shrink-0 transition-transform duration-150"
          style={{
            color: "var(--text-dim)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown — rendered in <body> to escape any overflow:hidden */}
      {open && createPortal(
        <div
          ref={dropRef}
          style={{
            position:   "absolute",
            top:        pos.top + 4,
            left:       pos.left,
            minWidth:   pos.width,
            width:      "max-content",
            maxWidth:   "min(480px, calc(100vw - 16px))",
            zIndex:     99999,
            background: "var(--bg-card)",
            border:     "1px solid var(--border-bright)",
            borderRadius: 6,
            boxShadow: "0 8px 28px rgba(0,0,0,0.28)",
            maxHeight:  260,
            overflowY:  "auto",
          }}
        >
          {options.map(o => {
            const val   = typeof o === "string" ? o : o.value;
            const lbl   = typeof o === "string" ? o : o.label;
            const isSel = String(val) === String(value);
            return (
              <div
                key={String(val)}
                className="px-3 py-2 font-mono text-sm cursor-pointer"
                style={{
                  background:  isSel ? "var(--green-glow)" : "transparent",
                  color:       isSel ? "var(--green)"      : "var(--text-primary)",
                  borderLeft: `2px solid ${isSel ? "var(--green)" : "transparent"}`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                onClick={() => { onChange(val); setOpen(false); }}
              >
                {lbl}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
