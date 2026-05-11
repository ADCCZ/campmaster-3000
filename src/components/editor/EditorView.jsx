import { useState, useRef, useCallback, useEffect } from "react";
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
          maxLength={50}
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
          max={99999}
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
      className="flex flex-shrink-0"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        minHeight: 56,
      }}
    >
      {tabs.map(tab => {
        const isReadonly = !isOrganizator && tab.id !== "map";
        const isAct      = active === tab.id;
        return (
          <button
            key={tab.id}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors font-semibold relative py-2 px-1"
            style={{
              color:        isAct ? "var(--green)" : "var(--text-muted)",
              background:   isAct ? "var(--green-glow)" : "transparent",
              borderBottom: `3px solid ${isAct ? "var(--green)" : "transparent"}`,
            }}
            onClick={() => setActive(tab.id)}
          >
            {tab.icon}
            <span className="text-xs font-mono text-center leading-tight">{tab.label}</span>
            {isReadonly && (
              <span
                className="absolute top-1 right-1 text-[9px] font-mono px-1 rounded"
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

// ── Panel edge toggle button (flex sibling in the row — no z-index fights) ───
function EdgeToggle({ side, open, onClick, label }) {
  const Icon = open
    ? (side === "left" ? ChevronLeft : ChevronRight)
    : (side === "left" ? ChevronRight : ChevronLeft);
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex flex-col items-center justify-center flex-shrink-0 gap-1"
      style={{
        width: 32,
        alignSelf: "stretch",
        borderRadius: side === "left" ? "0 5px 5px 0" : "5px 0 0 5px",
        border: "1px solid var(--border-bright)",
        borderLeft:  side === "left"  ? "none" : "1px solid var(--border-bright)",
        borderRight: side === "right" ? "none" : "1px solid var(--border-bright)",
        background: "var(--bg-secondary)",
        color: "var(--text-muted)",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
        position: "relative",
        zIndex: 50,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--green)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-muted)"; }}
    >
      <Icon size={13} />
      {label && (
        <span style={{
          fontSize: 8,
          writingMode: "vertical-rl",
          transform: side === "left" ? "rotate(180deg)" : "none",
          letterSpacing: "0.05em",
          fontFamily: "monospace",
          opacity: 0.65,
          maxHeight: 72,
          overflow: "hidden",
        }}>
          {label}
        </span>
      )}
    </button>
  );
}

export default function EditorView({ sidebarTab, setSidebarTab, activeDay, activeStage, eventId, eventData, role }) {
  const { t } = useI18n();
  const [selectedPin,  setSelectedPin]  = useState(null);
  const [addingPinFor, setAddingPinFor] = useState(null);
  const [leftWidth,    setLeftWidth]    = useState(LEFT_DEFAULT);
  const [rightWidth,   setRightWidth]   = useState(RIGHT_DEFAULT);
  const [showLeft,     setShowLeft]     = useState(() => window.innerWidth >= 768);
  const [showRight,    setShowRight]    = useState(() => window.innerWidth >= 768);

  const selectPin = useCallback((pinId) => {
    setSelectedPin(pinId);
    if (pinId && window.innerWidth < 768) setShowRight(true);
  }, []);

  const editPin = useCallback((pinId) => {
    selectPin(pinId);
    setShowRight(true);
  }, [selectPin]);

  // On mobile: hide both panels when entering pin-adding mode
  useEffect(() => {
    if (addingPinFor && window.innerWidth < 768) {
      setShowLeft(false);
      setShowRight(false);
    }
  }, [addingPinFor]);

  const dragLeft  = useCallback((delta) => {
    setLeftWidth(w => Math.min(MAX_LEFT, Math.max(MIN_PANEL, w + delta)));
  }, []);

  const dragRight = useCallback((delta) => {
    setRightWidth(w => Math.min(MAX_RIGHT, Math.max(MIN_PANEL, w - delta)));
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Main area ────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {sidebarTab === "map" && (
          <>
            {/* Left panel */}
            {showLeft && (
              <>
                {/* Mobile: overlay between both EdgeToggles */}
                <div className="flex md:hidden absolute z-40" style={{ top: 0, left: 32, right: 32, bottom: 0 }}>
                  <GameTree
                    eventId={eventId} eventData={eventData} activeDay={activeDay} role={role}
                    selectedPin={selectedPin} onSelectPin={selectPin} onEditPin={editPin}
                    addingPinFor={addingPinFor} setAddingPinFor={setAddingPinFor}
                    onClose={() => setShowLeft(false)}
                  />
                </div>
                {/* Desktop: fixed-width side panel */}
                <div className="hidden md:flex" style={{ width: leftWidth, flexShrink: 0, overflow: "hidden", position: "relative", zIndex: 10 }}>
                  <GameTree
                    eventId={eventId} eventData={eventData} activeDay={activeDay} role={role}
                    selectedPin={selectedPin} onSelectPin={selectPin} onEditPin={editPin}
                    addingPinFor={addingPinFor} setAddingPinFor={setAddingPinFor}
                  />
                </div>
              </>
            )}

            {showLeft && <div className="hidden lg:flex"><ResizeHandle onDrag={dragLeft} /></div>}

            <EdgeToggle side="left" open={showLeft} onClick={() => setShowLeft(v => !v)}
              label={showLeft ? t("editor.hide") : t("editor.showTree")} />

            {/* Center: map — zIndex:0 contains Leaflet's internal z-indices so our overlays win */}
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col" style={{ position: "relative", zIndex: 0 }}>
              <MapView
                eventId={eventId}
                eventData={eventData}
                activeDay={activeDay}
                activeStage={activeStage}
                role={role}
                selectedPin={selectedPin}
                onSelectPin={selectPin}
                addingPinFor={addingPinFor}
                setAddingPinFor={setAddingPinFor}
              />
            </div>

            <EdgeToggle side="right" open={showRight} onClick={() => setShowRight(v => !v)}
              label={showRight ? t("editor.hide") : t("editor.showInfo")} />

            {showRight && <div className="hidden lg:flex"><ResizeHandle onDrag={dragRight} /></div>}

            {/* Right panel */}
            {showRight && (
              <>
                {/* Mobile: overlay between both EdgeToggles */}
                <div className="flex md:hidden absolute z-40" style={{ top: 0, left: 32, right: 32, bottom: 0 }}>
                  <PropertiesPanel
                    eventId={eventId} eventData={eventData} selectedPin={selectedPin} role={role}
                    onClose={() => setShowRight(false)}
                  />
                </div>
                {/* Desktop: fixed-width side panel */}
                <div className="hidden md:flex" style={{ width: rightWidth, flexShrink: 0, overflow: "hidden", position: "relative", zIndex: 10 }}>
                  <PropertiesPanel
                    eventId={eventId} eventData={eventData} selectedPin={selectedPin} role={role}
                  />
                </div>
              </>
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
            {/* FAB — hidden when a panel is open */}
            {!addingPinFor && !activePinObj && !showLeft && !showRight && (
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


          </div>
        );
      })()}
    </div>
  );
}
