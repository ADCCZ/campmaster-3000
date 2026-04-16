import { X } from "lucide-react";

export default function ModalShell({ title, onClose, children, width = "max-w-lg" }) {
  return (
    <div
      className="cm-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`cm-dialog ${width} w-full mx-4`}>
        <div
          className="flex items-center justify-between pb-3 mb-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="font-mono font-bold text-sm tracking-wide uppercase" style={{ color: "var(--text-primary)" }}>
            {title}
          </span>
          <button
            onClick={onClose}
            className="cm-icon-btn w-7 h-7"
            style={{ borderColor: "transparent" }}
          >
            <X size={14} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
