import { useState, useRef, useCallback } from "react";
import { Map, Users, BarChart2, ChevronLeft, ChevronRight, Plus, X, MapPin } from "lucide-react";
import GameTree        from "./GameTree";
import MapView         from "./MapView";
import PropertiesPanel from "./PropertiesPanel";
import TeamsView       from "./TeamsView";
import StatsView       from "./StatsView";
import { useI18n }     from "../../context/I18nContext";
import { useGame }     from "../../context/GameContext";

// ── Resize handle ─────────────────────────────────────────────────────────────
function ResizeHandle({ onDrag }) {
  const dragging = useRef(false);
  const lastX    = useRef(0);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    lastX.current    = e.clientX;

    function onMove(ev) {
      if (!dragging.current) return;
      const delta = ev.clientX - lastX.current;
      lastX.current = ev.clientX;
      onDrag(delta);
    }
    function onUp() {
      dragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  }, [onDrag]);

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: 6,
        flexShrink: 0,
        cursor: "col-resize",
        background: "var(--border)",
        transition: "background 0.15s",
        position: "relative",
        zIndex: 10,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--green)"}
      onMouseLeave={e => e.currentTarget.style.background = "var(--border)"}
      title="Táhni pro změnu šířky"
    />
  );
}

// ── Mobile pin edit bottom sheet ─────────────────────────────────────────────
function MobilePinSheet({ eventId, pin, onClose }) {
  const { updatePin } = useGame();
  const { t } = useI18n();
  const [name,      setName]      = useState(pin?.name      ?? "");
  const [maxPoints, setMaxPoints] = useState(pin?.maxPoints ?? 10);

  if (!pin) return null;

  function save() {
    if (!name.trim()) return;
    updatePin(eventId, pin.id, { name: name.trim(), maxPoints: Math.max(1, maxPoints) });
    onClose();
  }

  return (
    <div
      className="md:hidden"
      style={{
        position: "fixed", bottom: 72, left: 0, right: 0,
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border-bright)",
        borderRadius: "14px 14px 0 0",
        padding: "16px 16px 20px",
        zIndex: 50,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          {pin.label} — {t("map.editStation") || "Upravit stanoviště"}
        </span>
        <button onClick={onClose} style={{ color: "var(--text-muted)", display: "flex" }}>
          <X size={18} />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <input
          className="cm-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t("map.stationName") || "Název stanoviště"}
          onKeyDown={e => e.key === "Enter" && save()}
        />
        <input
          className="cm-input"
          type="number"
          value={maxPoints}
          onChange={e => setMaxPoints(Number(e.target.value))}
          min={1}
          placeholder="Max. bodů"
        />
        <button className="cm-btn-primary" onClick={save}>
          {t("common.save") || "Uložit"}
        </button>
      </div>
    </div>
  );
}

// ── Bottom nav ────────────────────────────────────────────────────────────────
function BottomNav({ active, setActive, role }) {
  const { t } = useI18n();
  const isOrganizator = role === "Organizátor";

  const tabs = [
    { id: "map",   icon: <Map size={22} />,      label: t("sidebar.map")   },
    { id: "teams", icon: <Users size={22} />,     label: t("sidebar.teams") },
    { id: "stats", icon: <BarChart2 size={22} />, label: t("sidebar.stats") },
  ];

  return (
    <div
      className="flex justify-center flex-shrink-0"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        height: 72,
        gap: 8,
        padding: "0 16px",
      }}
    >
      {tabs.map(tab => {
        const isReadonly = !isOrganizator && tab.id !== "map";
        const isAct      = active === tab.id;
        return (
          <button
            key={tab.id}
            className="flex items-center justify-center gap-3 px-10 transition-colors font-semibold relative"
            style={{
              color:      isAct ? "var(--green)" : "var(--text-muted)",
              background: isAct ? "var(--green-glow)" : "transparent",
              borderBottom: `3px solid ${isAct ? "var(--green)" : "transparent"}`,
              fontSize: 17,
              minWidth: 160,
            }}
            onClick={() => setActive(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {isReadonly && (
              <span
                className="absolute top-2 right-2 text-[10px] font-mono px-1 rounded"
                style={{ border: "1px solid var(--border)", color: "var(--text-dim)" }}
              >
                {t("sidebar.readOnly")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Editor view ───────────────────────────────────────────────────────────────
const LEFT_DEFAULT  = 360;   // 75 % of 480
const RIGHT_DEFAULT = 312;   // 75 % of 416
const MIN_PANEL     = 160;
const MAX_LEFT      = 700;
const MAX_RIGHT     = 700;

// ── Panel edge toggle button (positioned in map area) ────────────────────────
function EdgeToggle({ side, open, onClick }) {
  const Icon = open
    ? (side === "left" ? ChevronLeft : ChevronRight)
    : (side === "left" ? ChevronRight : ChevronLeft);
  return (
    <button
      onClick={onClick}
      title={open ? "Skrýt panel" : "Zobrazit panel"}
      style={{
        position: "absolute",
        top: "50%",
        [side]: 0,
        transform: "translateY(-50%)",
        zIndex: 20,
        width: 20,
        height: 44,
        borderRadius: side === "left" ? "0 6px 6px 0" : "6px 0 0 6px",
        border: "1px solid var(--border-bright)",
        borderLeft: side === "left" ? "none" : "1px solid var(--border-bright)",
        borderRight: side === "right" ? "none" : "1px solid var(--border-bright)",
        background: "var(--bg-card)",
        color: "var(--text-muted)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--green)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.color = "var(--text-muted)"; }}
    >
      <Icon size={11} />
    </button>
  );
}

export default function EditorView({ sidebarTab, setSidebarTab, activeDay, activeStage, eventId, eventData, role }) {
  const { t } = useI18n();
  const [selectedPin,  setSelectedPin]  = useState(null);
  const [addingPinFor, setAddingPinFor] = useState(null);
  const [leftWidth,    setLeftWidth]    = useState(LEFT_DEFAULT);
  const [rightWidth,   setRightWidth]   = useState(RIGHT_DEFAULT);
  const [showLeft,     setShowLeft]     = useState(true);
  const [showRight,    setShowRight]    = useState(true);

  const dragLeft  = useCallback((delta) => {
    setLeftWidth(w => Math.min(MAX_LEFT, Math.max(MIN_PANEL, w + delta)));
  }, []);

  const dragRight = useCallback((delta) => {
    setRightWidth(w => Math.min(MAX_RIGHT, Math.max(MIN_PANEL, w - delta)));
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Main area ────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {sidebarTab === "map" && (
          <>
            {/* Left: game tree — hidden on mobile, toggleable on desktop */}
            {showLeft && (
              <div className="hidden md:flex" style={{ width: leftWidth, flexShrink: 0, overflow: "hidden", position: "relative", zIndex: 10 }}>
                <GameTree
                  eventId={eventId}
                  eventData={eventData}
                  activeDay={activeDay}
                  role={role}
                  selectedPin={selectedPin}
                  onSelectPin={setSelectedPin}
                  addingPinFor={addingPinFor}
                  setAddingPinFor={setAddingPinFor}
                />
              </div>
            )}

            {showLeft && <div className="hidden md:block"><ResizeHandle onDrag={dragLeft} /></div>}

            {/* Center: map — full width on mobile, panel toggles at edges */}
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col" style={{ position: "relative" }}>
              {/* Left-edge toggle (always visible on md+) */}
              <div className="hidden md:block">
                <EdgeToggle side="left" open={showLeft} onClick={() => setShowLeft(v => !v)} />
              </div>
              {/* Right-edge toggle (always visible on md+) */}
              <div className="hidden md:block">
                <EdgeToggle side="right" open={showRight} onClick={() => setShowRight(v => !v)} />
              </div>
              <MapView
                eventId={eventId}
                eventData={eventData}
                activeDay={activeDay}
                activeStage={activeStage}
                role={role}
                selectedPin={selectedPin}
                onSelectPin={setSelectedPin}
                addingPinFor={addingPinFor}
                setAddingPinFor={setAddingPinFor}
              />
            </div>

            {showRight && <div className="hidden md:block"><ResizeHandle onDrag={dragRight} /></div>}

            {/* Right: properties — hidden on mobile, toggleable on desktop */}
            {showRight && (
              <div className="hidden md:flex" style={{ width: rightWidth, flexShrink: 0, overflow: "hidden", position: "relative", zIndex: 10 }}>
                <PropertiesPanel
                  eventId={eventId}
                  eventData={eventData}
                  selectedPin={selectedPin}
                  role={role}
                />
              </div>
            )}
          </>
        )}

        {sidebarTab === "teams" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TeamsView eventId={eventId} eventData={eventData} role={role} />
          </div>
        )}

        {sidebarTab === "stats" && (
          <div className="flex-1 min-h-0 overflow-auto">
            <StatsView eventData={eventData} role={role} activeDay={activeDay} activeStage={activeStage} />
          </div>
        )}
      </div>

      {/* ── Bottom nav ───────────────────────────────────────── */}
      <BottomNav active={sidebarTab} setActive={setSidebarTab} role={role} />

      {/* ── Mobile: FAB + pin sheet (map tab only, Organizátor) ── */}
      {sidebarTab === "map" && role === "Organizátor" && (() => {
        const firstStage = eventData.tree?.findIndex?.(d => d.stages?.length > 0);
        const hasStages  = firstStage >= 0;
        const di = hasStages ? firstStage : 0;
        const si = hasStages ? 0 : 0;
        const activePinObj = selectedPin ? (eventData.pins ?? []).find(p => p.id === selectedPin) : null;
        return (
          <div className="md:hidden">
            {/* FAB — shown when not in adding mode and no pin selected */}
            {!addingPinFor && !activePinObj && (
              <button
                onClick={() => hasStages && setAddingPinFor({ di, si })}
                title={hasStages ? (t("map.addStation") || "Přidat stanoviště") : "Nejprve přidejte etapu v editoru"}
                style={{
                  position: "fixed", bottom: 84, right: 16,
                  width: 52, height: 52, borderRadius: "50%",
                  background: hasStages ? "var(--green)" : "var(--border)",
                  color: hasStages ? "var(--bg-base)" : "var(--text-dim)",
                  border: "none", cursor: hasStages ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: hasStages ? "0 4px 20px rgba(34,197,94,0.45)" : "none",
                  zIndex: 50, transition: "all 0.15s",
                }}
              >
                <Plus size={22} />
              </button>
            )}

            {/* Cancel-adding banner */}
            {addingPinFor && (
              <div style={{
                position: "fixed", bottom: 72, left: 0, right: 0, zIndex: 50,
                background: "var(--green-glow)", borderTop: "1px solid var(--green)",
                padding: "10px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span className="font-mono text-sm" style={{ color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={13} /> {t("map.clickMapToPlace") || "Klikni na mapu pro umístění"}
                </span>
                <button onClick={() => setAddingPinFor(null)} style={{ color: "var(--green)", display: "flex" }}>
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Pin edit bottom sheet */}
            {activePinObj && !addingPinFor && (
              <MobilePinSheet
                eventId={eventId}
                pin={activePinObj}
                onClose={() => setSelectedPin(null)}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
}
