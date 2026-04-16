import { useState, useRef, useCallback, useEffect } from "react";
import { Map, Users, BarChart2 } from "lucide-react";
import GameTree        from "./GameTree";
import MapView         from "./MapView";
import PropertiesPanel from "./PropertiesPanel";
import TeamsView       from "./TeamsView";
import StatsView       from "./StatsView";
import { useI18n }     from "../../context/I18nContext";

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

export default function EditorView({ sidebarTab, setSidebarTab, activeDay, activeStage, eventId, eventData, role }) {
  const [selectedPin,  setSelectedPin]  = useState(null);
  const [addingPinFor, setAddingPinFor] = useState(null);
  const [leftWidth,    setLeftWidth]    = useState(LEFT_DEFAULT);
  const [rightWidth,   setRightWidth]   = useState(RIGHT_DEFAULT);

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
            {/* Left: game tree */}
            <div style={{ width: leftWidth, flexShrink: 0, display: "flex", overflow: "hidden", position: "relative", zIndex: 10 }}>
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

            <ResizeHandle onDrag={dragLeft} />

            {/* Center: map */}
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
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

            <ResizeHandle onDrag={dragRight} />

            {/* Right: properties */}
            <div style={{ width: rightWidth, flexShrink: 0, overflow: "hidden", display: "flex", position: "relative", zIndex: 10 }}>
              <PropertiesPanel
                eventId={eventId}
                eventData={eventData}
                selectedPin={selectedPin}
                role={role}
              />
            </div>
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
    </div>
  );
}
