import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2, MapPin } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useGame } from "../../context/GameContext";
import EditableLabel from "../common/EditableLabel";

export default function GameTree({ eventId, eventData, activeDay, role, selectedPin, onSelectPin, addingPinFor, setAddingPinFor }) {
  const { t } = useI18n();
  const { updateTree } = useGame();
  const isOrganizator = role === "Organizátor";
  const [openDays, setOpenDays] = useState([0, 1, 2, 3]);

  const tree = eventData.tree ?? [];
  const pins = eventData.pins ?? [];

  function toggleDay(di) {
    setOpenDays(prev => prev.includes(di) ? prev.filter(x => x !== di) : [...prev, di]);
  }
  function setDayLabel(di, label) {
    updateTree(eventId, tree.map((d, i) => i === di ? { ...d, label } : d));
  }
  function setStageLabel(di, si, label) {
    updateTree(eventId, tree.map((d, i) =>
      i === di ? { ...d, stages: d.stages.map((s, j) => j === si ? { ...s, label } : s) } : d
    ));
  }
  function deleteDay(di) { updateTree(eventId, tree.filter((_, i) => i !== di)); }
  function deleteStage(di, si) {
    updateTree(eventId, tree.map((d, i) =>
      i === di ? { ...d, stages: d.stages.filter((_, j) => j !== si) } : d
    ));
  }
  function addDay() {
    updateTree(eventId, [...tree, { label: `Den ${tree.length + 1}`, stages: [] }]);
  }
  function addStage(di) {
    updateTree(eventId, tree.map((d, i) =>
      i === di ? { ...d, stages: [...d.stages, { label: `Etapa ${d.stages.length + 1}`, pinLabels: [] }] } : d
    ));
  }

  const isAddingFor = (di, si) => addingPinFor?.di === di && addingPinFor?.si === si;

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="cm-label" style={{ fontSize: 15 }}>{t("map.gameStructure")}</span>
        {isOrganizator && (
          <button
            className="transition-colors"
            style={{ color: "var(--text-dim)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--green)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
            onClick={addDay}
            title={t("map.addDay")}
          >
            <Plus size={13} />
          </button>
        )}
      </div>

      {/* Tree */}
      <div className="overflow-y-auto flex-1 p-2 space-y-0.5 font-mono text-sm">
        {tree.map((day, di) => {
          const isActive = activeDay === di;
          const isOpen   = openDays.includes(di);
          return (
            <div key={di}>
              {/* Day row */}
              <div
                className="flex items-center gap-1 w-full px-2 py-1 rounded group cursor-pointer"
                style={{ background: isActive ? "var(--bg-hover)" : "transparent" }}
                onClick={() => toggleDay(di)}
              >
                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                <EditableLabel
                  value={day.label}
                  onChange={v => setDayLabel(di, v)}
                  disabled={!isOrganizator}
                  className="font-bold flex-1 min-w-0"
                  style={{ color: "var(--text-primary)" }}
                />
                {isOrganizator && (
                  <button
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--text-dim)" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
                    title={t("map.deleteDay")}
                    onClick={e => { e.stopPropagation(); deleteDay(di); }}
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>

              {/* Stages */}
              {isOpen && day.stages.map((stage, si) => (
                <div key={si} className="ml-3 mt-0.5">
                  <div className="flex items-center gap-1 px-2 py-0.5 group">
                    <ChevronRight size={10} className="flex-shrink-0" style={{ color: "var(--text-dim)" }} />
                    <EditableLabel
                      value={stage.label}
                      onChange={v => setStageLabel(di, si, v)}
                      disabled={!isOrganizator}
                      className="font-semibold flex-1 min-w-0 truncate"
                      style={{ color: "var(--text-muted)" }}
                    />
                    {isOrganizator && (
                      <button
                        className="flex-shrink-0 transition-colors"
                        style={{ color: isAddingFor(di, si) ? "var(--green)" : "var(--text-dim)" }}
                        title={t("map.addStation")}
                        onClick={() => setAddingPinFor(isAddingFor(di, si) ? null : { di, si })}
                      >
                        <Plus size={10} />
                      </button>
                    )}
                    {isOrganizator && (
                      <button
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-dim)" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
                        title={t("map.deleteStage")}
                        onClick={e => { e.stopPropagation(); deleteStage(di, si); }}
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>

                  {/* Stations */}
                  {stage.pinLabels.map(lbl => {
                    const pin   = pins.find(p => p.label === lbl);
                    const isSel = pin && selectedPin === pin.id;
                    const isOwn = isOrganizator || pin?.vedouci === role;
                    return (
                      <div
                        key={lbl}
                        className="ml-4 px-2 py-0.5 cursor-pointer rounded flex items-center gap-1 group transition-colors"
                        style={{
                          background: isSel ? "var(--green-glow)" : "transparent",
                          borderLeft: isSel ? "2px solid var(--green)" : "2px solid transparent",
                          color: isSel ? "var(--green)" : isOwn ? "var(--text-primary)" : "var(--text-dim)",
                        }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "var(--bg-hover)"; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                        onClick={() => pin && onSelectPin(pin.id)}
                      >
                        <MapPin
                          size={9}
                          className="flex-shrink-0"
                          style={{ color: isSel ? "var(--green)" : "var(--text-muted)", opacity: isOwn ? 1 : 0.4 }}
                        />
                        <span className="truncate flex-1">{pin?.name ?? lbl}</span>
                        {isOrganizator && (
                          <button
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "var(--text-dim)" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
                            title={t("map.deleteStation")}
                            onClick={e => e.stopPropagation()}
                          >
                            <Trash2 size={9} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Add stage */}
              {isOpen && isOrganizator && (
                <button
                  className="ml-7 mt-0.5 flex items-center gap-1 text-xs transition-colors"
                  style={{ color: "var(--text-dim)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--green)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
                  onClick={() => addStage(di)}
                >
                  <Plus size={8} /> etapa
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Adding pin banner */}
      {addingPinFor && (
        <div
          className="px-3 py-2 text-xs font-mono flex items-center gap-1 flex-shrink-0"
          style={{ borderTop: "1px solid var(--green)", background: "var(--green-glow)", color: "var(--green)" }}
        >
          <MapPin size={11} /> {t("map.clickMapToPlace")}
        </div>
      )}
    </div>
  );
}
