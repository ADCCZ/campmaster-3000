import { useState } from "react";
import { Plus, Play, Trash2, MapPin, Users, Calendar, Pencil, Check, X } from "lucide-react";
import { useGame } from "../../context/GameContext";
import { useI18n } from "../../context/I18nContext";
import { useTheme } from "../../context/ThemeContext";
import ConfirmDialog from "../common/ConfirmDialog";
import { computeEventStatus } from "../../utils/validation";

const STATUS_CONFIG = {
  active:    { color: "#22c55e", shadow: "0 0 6px #22c55e66" },
  completed: { color: "#6b7280", shadow: "none"               },
  archived:  { color: "#6b7280", shadow: "none"               },
  upcoming:  { color: "#60a5fa", shadow: "0 0 6px #60a5fa66" },
};

function GameCard({ event, onOpen, onDelete, onRename }) {
  const { t } = useI18n();
  const { dark } = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  function startEdit(e) {
    e.stopPropagation();
    setNameInput(event.name);
    setEditingName(true);
  }

  function commitEdit() {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== event.name) onRename(event.id, trimmed);
    setEditingName(false);
  }

  const pinCount  = event.pins?.length ?? 0;
  const teamCount = event.teams?.length ?? 0;
  const statusKey = computeEventStatus(event);
  const statusCfg = STATUS_CONFIG[statusKey] ?? null;

  return (
    <>
      <div
        className="cm-card group flex flex-col"
        style={{ width: 400, minHeight: 148 }}
        onClick={() => onOpen(event.id)}
      >
        {/* Top: title + status indicator */}
        <div className="flex items-start justify-between gap-3 mb-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                <input
                  className="cm-input text-sm font-bold flex-1"
                  value={nameInput}
                  autoFocus
                  maxLength={80}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingName(false); }}
                />
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={commitEdit}
                  title="Uložit"
                  style={{ color: "var(--green)", padding: 3, display: "flex", alignItems: "center", flexShrink: 0 }}
                ><Check size={13} /></button>
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setEditingName(false)}
                  title="Zrušit"
                  style={{ color: "#ef4444", padding: 3, display: "flex", alignItems: "center", flexShrink: 0 }}
                ><X size={13} /></button>
              </div>
            ) : (
              <>
                <div className="font-bold text-base leading-snug truncate" style={{ color: "var(--text-primary)" }}>
                  {event.icon} {event.name}
                </div>
                <button
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-dim)", padding: 2, display: "flex", alignItems: "center" }}
                  onClick={startEdit}
                  title={t("home.rename")}
                >
                  <Pencil size={12} />
                </button>
              </>
            )}
          </div>
          {statusCfg && (
            <div
              className="flex items-center gap-1.5 flex-shrink-0 mt-0.5"
              style={{ padding: "2px 6px", border: `1px solid ${statusCfg.color}33`, borderRadius: 6 }}
            >
              <span className="font-mono text-[10px] whitespace-nowrap" style={{ color: statusCfg.color }}>{t(`home.status.${statusKey}`)}</span>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusCfg.color, boxShadow: statusCfg.shadow }} />
            </div>
          )}
        </div>

        {/* Spacer — pushes bottom content to card bottom */}
        <div className="flex-1" />

        {/* Bottom: date + badges + buttons */}
        <div>
          {event.dates && (
            <div className="flex items-center gap-1.5 mt-2 mb-2.5" style={{ color: "var(--text-dim)" }}>
              <Calendar size={11} />
              <span className="font-mono text-[11px]">{event.dates}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <div
              className="flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full"
              style={{ border: "1px solid var(--border-bright)", color: "var(--green)", background: "var(--green-glow)" }}
            >
              <Users size={11} /> {teamCount} {t("home.teams")}
            </div>
            <div
              className="flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <MapPin size={11} /> {pinCount} {t("home.stations")}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="cm-btn-primary flex-1"
              onClick={(e) => { e.stopPropagation(); onOpen(event.id); }}
            >
              <Play size={14} /> {t("home.open")}
            </button>
            <button
              className="flex-shrink-0 rounded-lg transition-colors"
              style={{ width: 42, height: 42, border: dark ? "none" : "1px solid #fca5a5", background: "rgba(239,68,68,0.08)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
              onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
              title={t("home.delete")}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          message={`${t("home.confirmDelete")} "${event.name}"?`}
          onConfirm={() => { onDelete(event.id); setConfirmOpen(false); }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}

export default function GameListView({ onOpenGame }) {
  const { events, deleteEvent, updateEvent } = useGame();
  const { t } = useI18n();
  const eventList = Object.values(events);

  return (
    <div className="flex-1 overflow-auto p-6 min-h-0" style={{ background: "var(--bg-base)" }}>
      {/* Header */}
      <div
        className="mb-6 pb-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h1 className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
          {t("home.title")}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          {eventList.length} {t("home.total")}
        </p>
      </div>

      {/* Game grid */}
      {eventList.length === 0 ? (
        <div
          className="cm-dashed flex flex-col items-center justify-center py-16 text-center"
        >
          <MapPin size={28} style={{ color: "var(--text-dim)", marginBottom: 10 }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("home.empty")}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-5 items-start justify-center">
          {eventList.map(event => (
            <GameCard
              key={event.id}
              event={event}
              onOpen={onOpenGame}
              onDelete={deleteEvent}
              onRename={(id, name) => updateEvent(id, { name })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
