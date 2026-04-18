import { useState } from "react";
import { Play, Pause, RotateCcw, Trophy, Clock, AlertTriangle, MapPin } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useGame } from "../../context/GameContext";
import { useTimer } from "../../hooks/useTimer";

const MEDALS = ["🥇", "🥈", "🥉"];
const STATUS_ORDER      = ["upcoming", "active", "done", "skipped"];
const TEAM_STATUS_ORDER = ["upcoming", "done", "skipped"];

// ── Status pill ────────────────────────────────────────────────────────────
function StatusPill({ status, active, onClick, className = "" }) {
  const { t } = useI18n();
  const labels = {
    upcoming: t("live.status.upcoming"),
    active:   t("live.status.active"),
    done:     t("live.status.done"),
    skipped:  t("live.status.skipped"),
  };
  const styles = {
    upcoming: active ? { border: "1px solid var(--border-bright)", color: "var(--text-dim)",     background: "var(--bg-secondary)" }
                     : { border: "1px solid var(--border)",         color: "var(--text-dim)",     background: "transparent" },
    active:   active ? { border: "1px solid var(--green)",         color: "var(--green)",         background: "var(--green-glow)" }
                     : { border: "1px solid var(--border)",         color: "var(--text-dim)",     background: "transparent" },
    done:     active ? { border: "1px solid var(--border-bright)", color: "var(--text-primary)", background: "var(--bg-hover)" }
                     : { border: "1px solid var(--border)",         color: "var(--text-dim)",     background: "transparent" },
    skipped:  active ? { border: "1px solid var(--border)",        color: "var(--text-muted)",   background: "var(--bg-secondary)" }
                     : { border: "1px solid var(--border)",         color: "var(--text-dim)",     background: "transparent" },
  };
  return (
    <button
      className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors whitespace-nowrap ${className}`}
      style={styles[status] ?? styles.active}
      onClick={onClick}
    >
      {labels[status]}
    </button>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--border)" }}>
      <Icon size={12} style={{ color: "var(--green)" }} />
      <span className="cm-label" style={{ fontSize: 11 }}>{label}</span>
    </div>
  );
}

// ── Action log entry ───────────────────────────────────────────────────────
function LogEntry({ a }) {
  return (
    <div className="px-3 py-2.5 font-mono text-xs" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-0.5">
        <span style={{ color: "var(--text-dim)" }}>{a.time}</span>
        <span className="font-bold" style={{ color: a.delta?.startsWith("+") ? "var(--green)" : "#ef4444" }}>
          {a.delta}{a.delta ? " b." : ""}
        </span>
      </div>
      <div className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{a.team}</div>
      <div className="text-[10px] truncate" style={{ color: "var(--text-dim)" }}>{a.station}</div>
      {a.by && (
        <div className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
          👤 {a.by}
        </div>
      )}
    </div>
  );
}

// ── Station list row ───────────────────────────────────────────────────────
function PinRow({ pin, stationStatuses, activeStationId, setActiveStationId }) {
  const st    = stationStatuses[pin.id] ?? "upcoming";
  const isAct = pin.id === activeStationId;
  return (
    <button
      className="w-full text-left px-3 py-2 font-mono text-xs flex items-center gap-2 transition-colors"
      style={{
        borderBottom: "1px solid var(--border)",
        borderLeft: `2px solid ${isAct ? "var(--green)" : "transparent"}`,
        background: isAct ? "var(--green-glow)" : "transparent",
        color: isAct ? "var(--green)" : "var(--text-muted)",
      }}
      onMouseEnter={e => { if (!isAct) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={e => { if (!isAct) e.currentTarget.style.background = "transparent"; }}
      onClick={() => setActiveStationId(pin.id)}
    >
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
        style={{ border: `1px solid ${isAct ? "var(--green)" : "var(--border-bright)"}`, color: isAct ? "var(--green)" : "var(--text-muted)" }}>
        {pin.label}
      </span>
      <span className="flex-1 truncate">{pin.name.replace(/^stanoviště\s*/i, "")}</span>
      {st === "done"    && <span style={{ color: "var(--green)",    fontSize: 9 }}>✓</span>}
      {st === "skipped" && <span style={{ color: "var(--text-dim)", fontSize: 9 }}>—</span>}
    </button>
  );
}

// ── Tab: Stanoviště ────────────────────────────────────────────────────────
function TabStanoviste({ eventId, eventData, role, stationStatuses, onStatusChange }) {
  const { t }    = useI18n();
  const { adjustScore, adjustStationScore, addLogEntry, updateTeamStationStatus } = useGame();
  const isOrg    = role === "Organizátor";
  const allPins  = eventData.pins ?? [];
  const myPins   = isOrg ? allPins : allPins.filter(p => p.vedouci === role);
  const teams    = eventData.teams ?? [];
  const tree     = eventData.tree ?? [];
  const teamStationStatuses = eventData.teamStationStatuses ?? {};

  const [activeStationId, setActiveStationId] = useState(myPins[0]?.id ?? null);
  const [alertSent, setAlertSent] = useState({});
  const [note, setNote] = useState("");
  const log = eventData.actionLog ?? [];

  const activePin = allPins.find(p => p.id === activeStationId) ?? myPins[0] ?? null;
  const stStatus  = activePin ? (stationStatuses[activePin.id] ?? "upcoming") : "upcoming";

  // Build grouped station list by day → stage
  const grouped = tree.map((day, di) => ({
    di, label: day.label,
    stages: day.stages.map((stage, si) => ({
      si, label: stage.label,
      pins: myPins.filter(p => p.day === di && p.stage === si),
    })).filter(s => s.pins.length > 0),
  })).filter(d => d.stages.length > 0);
  const groupedIds = new Set(grouped.flatMap(d => d.stages.flatMap(s => s.pins.map(p => p.id))));
  const ungrouped  = myPins.filter(p => !groupedIds.has(p.id));

  const TEAM_STATUS_STYLE = {
    upcoming: { label: t("live.team.upcoming") || "Bude",           color: "var(--text-dim)",    border: "1px solid var(--border)" },
    done:     { label: t("live.team.done")     || "Splněno",        color: "var(--green)",       border: "1px solid var(--green)" },
    skipped:  { label: t("live.team.skipped")  || "Neobjevilo se",  color: "#ef4444",            border: "1px solid #fca5a5" },
  };

  function cycleTeamStatus(teamId) {
    if (!activePin) return;
    const cur  = teamStationStatuses[activePin.id]?.[teamId] ?? "upcoming";
    const next = TEAM_STATUS_ORDER[(TEAM_STATUS_ORDER.indexOf(cur) + 1) % TEAM_STATUS_ORDER.length];
    updateTeamStationStatus(eventId, activePin.id, teamId, next);
  }

  function adjust(team, delta) {
    let d = delta;
    if (d < 0 && activePin) {
      const stationPts = eventData.stationScores?.[activePin.id]?.[team.id] ?? 0;
      d = Math.max(d, -stationPts);
      if (d === 0) return;
    }
    adjustScore(eventId, team.id, d);
    if (activePin) adjustStationScore(eventId, activePin.id, team.id, d);
    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    const entry = { id: Date.now(), time, team: team.name, delta: `${d > 0 ? "+" : ""}${d}`, station: activePin?.name ?? "", by: role };
    addLogEntry(eventId, entry);
  }

  return (
    <div className="flex gap-3 flex-1 min-h-0">

      {/* Station list */}
      <div className="cm-box flex-shrink-0 flex flex-col w-28 sm:w-44">
        <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="cm-label" style={{ fontSize: 10 }}>{t("live.myStations")}</span>
          {!isOrg && <span className="cm-tag text-[9px]">{role}</span>}
        </div>
        <div className="overflow-y-auto flex-1">
          {grouped.map(day => (
            <div key={day.di}>
              <div className="px-3 py-1 font-mono font-bold text-[9px] uppercase tracking-wider flex-shrink-0"
                style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", color: "var(--green)" }}>
                {day.label}
              </div>
              {day.stages.map(stage => (
                <div key={stage.si}>
                  <div className="px-4 py-0.5 font-mono text-[9px] italic"
                    style={{ borderBottom: "1px solid var(--border)", color: "var(--text-dim)" }}>
                    {stage.label}
                  </div>
                  {stage.pins.map(pin => <PinRow key={pin.id} pin={pin} stationStatuses={stationStatuses} activeStationId={activeStationId} setActiveStationId={setActiveStationId} />)}
                </div>
              ))}
            </div>
          ))}
          {ungrouped.map(pin => <PinRow key={pin.id} pin={pin} stationStatuses={stationStatuses} activeStationId={activeStationId} setActiveStationId={setActiveStationId} />)}
          {myPins.length === 0 && (
            <div className="px-3 py-4 text-xs text-center font-mono" style={{ color: "var(--text-dim)" }}>
              Žádná přiřazená stanoviště
            </div>
          )}
        </div>
      </div>

      {/* Active station detail */}
      <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
        {activePin ? (
          <>
            {/* Header */}
            <div className="cm-box p-3 flex gap-3 items-start">
              {/* Circle label */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 font-mono"
                style={{ background: "var(--green)", color: "var(--bg-base)" }}>
                {activePin.label}
              </div>

              {/* Info + buttons: row on sm+, column on mobile (buttons go 2×2 below) */}
              <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 items-start" style={{ minWidth: 0 }}>

                {/* Text info */}
                <div className="flex-1 w-full overflow-hidden">
                  <div className="font-mono font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ color: "var(--text-primary)" }}>
                    {activePin.name}
                  </div>
                  {activePin.vedouci && (
                    <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>🧑‍🏫 {activePin.vedouci}</div>
                  )}
                  {activePin.description && (
                    <div className="font-mono text-[10px] mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{activePin.description}</div>
                  )}
                </div>

                {/* Row 1: status pills */}
                <div className="flex flex-wrap gap-1 w-full sm:w-auto flex-shrink-0">
                  {STATUS_ORDER.map(k => (
                    <StatusPill key={k} status={k} active={stStatus === k}
                      onClick={() => onStatusChange(activePin.id, k)} />
                  ))}
                </div>
                {/* Row 2: problem button aligned right */}
                <div className="flex justify-end w-full sm:w-auto flex-shrink-0">
                  <button
                    className="text-[10px] font-mono px-2 py-1 flex items-center justify-center gap-1 rounded transition-colors whitespace-nowrap"
                    style={alertSent[activePin.id]
                      ? { border: "1px solid var(--border)", color: "var(--text-dim)", background: "transparent" }
                      : { border: "1px solid #fca5a5", color: "#ef4444", background: "rgba(239,68,68,0.06)" }}
                    onMouseEnter={e => { if (!alertSent[activePin.id]) e.currentTarget.style.background = "rgba(239,68,68,0.14)"; }}
                    onMouseLeave={e => { if (!alertSent[activePin.id]) e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                    onClick={() => setAlertSent(prev => ({ ...prev, [activePin.id]: true }))}
                  >
                    <AlertTriangle size={10} />
                    {alertSent[activePin.id] ? t("live.problemSent") : t("live.problem")}
                  </button>
                </div>

              </div>
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {teams.map(team => {
                return (
                  <div key={team.id} className="cm-box p-3 lg:p-4 flex flex-col items-center gap-2 lg:gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: team.color }} />
                      <span className="font-mono font-bold text-sm" style={{ color: "var(--text-muted)" }}>{team.name}</span>
                    </div>
                    <div className="font-mono font-black tabular-nums"
                      style={{ fontSize: "clamp(28px, 3.5vw, 44px)", lineHeight: 1, color: "var(--text-primary)" }}>
                      {(team.score ?? 0).toLocaleString("cs")}
                    </div>
                    <span className="cm-label" style={{ fontSize: 10 }}>{t("live.points")}</span>

                    {/* Per-team status at this station */}
                    {(() => {
                      const tSt  = teamStationStatuses[activePin.id]?.[team.id] ?? "upcoming";
                      const tCfg = TEAM_STATUS_STYLE[tSt] ?? TEAM_STATUS_STYLE.upcoming;
                      return (
                        <div className="w-full flex items-center justify-between"
                          style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                          <span className="font-mono text-[10px]" style={{ color: "var(--text-dim)" }}>
                            {t("live.teamStatus") || "Stav týmu"}
                          </span>
                          <button
                            className="text-[10px] font-mono px-2 py-0.5 rounded transition-colors"
                            style={{ border: tCfg.border, color: tCfg.color, background: "transparent" }}
                            onClick={() => cycleTeamStatus(team.id)}
                          >
                            {tCfg.label}
                          </button>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-4 gap-1.5 w-full">
                      {[[-10, false], [-1, false], [+1, true], [+10, true]].map(([d, pos]) => (
                        <button
                          key={d}
                          className="py-1.5 font-mono font-bold text-xs rounded transition-colors"
                          style={{
                            border:      pos ? "1px solid var(--green)" : "1px solid #fca5a5",
                            color:       pos ? "var(--green)"           : "#ef4444",
                            background:  "transparent",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = pos ? "var(--green-glow)" : "rgba(239,68,68,0.08)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          onClick={() => adjust(team, d)}
                        >
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note */}
            <div className="cm-box p-4">
              <label className="cm-label block mb-2" style={{ fontSize: 10 }}>{t("live.noteLabel")}</label>
              <div className="flex gap-2">
                <input className="cm-input" placeholder={t("live.notePlaceholder")}
                  value={note} maxLength={200} onChange={e => setNote(e.target.value)} />
                <button className="cm-btn flex-shrink-0" style={{ height: 42, fontSize: 13 }}
                  onClick={() => {
                    if (note.trim() && activePin) {
                      const now  = new Date();
                      const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
                      const entry = { id: Date.now(), time, team: `📝 ${note.trim()}`, delta: "", station: activePin.name ?? "", by: role };
                      addLogEntry(eventId, entry);
                    }
                    setNote("");
                  }}>
                  {t("live.save")}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="cm-dashed flex-1 flex items-center justify-center font-mono text-xs"
            style={{ color: "var(--text-dim)" }}>
            Vyberte stanoviště ze seznamu vlevo
          </div>
        )}
      </div>

      {/* Action log — hidden below xl, visible only on large screens */}
      <div className="cm-box flex-shrink-0 flex-col hidden xl:flex" style={{ width: 200 }}>
        <SectionHeader icon={Clock} label={t("live.recentActions")} />
        <div className="overflow-y-auto flex-1">
          {log.map((a, i) => <LogEntry key={a.id ?? i} a={a} />)}
          {log.length === 0 && (
            <div className="px-3 py-4 text-xs text-center font-mono" style={{ color: "var(--text-dim)" }}>—</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Přehled ───────────────────────────────────────────────────────────
function TabPrehled({ eventId, eventData, stationStatuses, onStatusChange }) {
  const { t }  = useI18n();
  const teams  = eventData.teams ?? [];
  const pins   = eventData.pins  ?? [];
  const teamStationStatuses = eventData.teamStationStatuses ?? {};
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const log    = eventData.actionLog ?? [];

  const STATUS_BADGE = {
    upcoming: t("live.status.upcoming"),
    active:   t("live.status.active"),
    done:     t("live.status.done"),
    skipped:  t("live.status.skipped"),
  };
  const STATUS_STYLE = {
    upcoming: { color: "var(--text-dim)",   border: "1px solid var(--border)",        background: "transparent" },
    active:   { color: "var(--green)",      border: "1px solid var(--green)",          background: "var(--green-glow)" },
    done:     { color: "var(--text-muted)", border: "1px solid var(--border-bright)", background: "var(--bg-hover)" },
    skipped:  { color: "var(--text-dim)",   border: "1px solid var(--border)",         background: "transparent" },
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 flex-1 overflow-y-auto lg:overflow-hidden lg:min-h-0">

      {/* Ranking table */}
      <div className="cm-box flex-1 flex flex-col lg:min-h-0 lg:overflow-hidden">
        <SectionHeader icon={Trophy} label={t("live.ranking")} />
        <div className="overflow-y-auto flex-1">
          <table className="w-full font-mono text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                {[t("live.rank"), t("live.team"), t("teams.col.score"), t("live.change"), t("live.station")].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((team, rank) => (
                <tr key={team.id} style={{
                  borderBottom: "1px solid var(--border)",
                  background: rank % 2 === 1 ? "var(--bg-secondary)" : "transparent",
                  opacity: team.status === "disqualified" ? 0.5 : 1,
                }}>
                  <td className="px-4 py-3 font-bold text-lg" style={{ width: 48, color: rank < 3 ? "var(--green)" : "var(--text-dim)" }}>
                    {MEDALS[rank] ?? `${rank + 1}.`}
                  </td>
                  <td className="px-4 py-3 font-bold" style={{ color: "var(--text-primary)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: team.color }} />
                      {team.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black tabular-nums text-lg"
                    style={{ color: rank === 0 ? "var(--green)" : "var(--text-primary)" }}>
                    {(team.score ?? 0).toLocaleString("cs")}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {log.find(e => e.team === team.name)?.delta ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-dim)" }}>
                    {pins[rank % pins.length]?.name?.split("—")[1]?.trim() ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right column — below table on mobile, beside on lg with fixed width */}
      <div className="flex flex-col gap-3 lg:w-60 lg:flex-shrink-0 lg:min-h-0 lg:overflow-hidden">

        {/* Station status — clickable to cycle through states */}
        <div className="cm-box flex-shrink-0 flex flex-col" style={{ maxHeight: "55%" }}>
          <SectionHeader icon={MapPin} label={t("live.stationStatus")} />
          <div className="overflow-y-auto flex-1">
            {pins.map(pin => {
              const st = stationStatuses[pin.id] ?? "upcoming";
              const TEAM_STYLE = {
                upcoming: { color: "var(--text-dim)",   border: "1px solid var(--border)" },
                done:     { color: "var(--green)",       border: "1px solid var(--green)" },
                skipped:  { color: "#ef4444",            border: "1px solid #fca5a5" },
              };
              const TEAM_LABEL = {
                upcoming: t("live.team.upcoming") || "Bude",
                done:     t("live.team.done")     || "Splněno",
                skipped:  t("live.team.skipped")  || "Neobjevil se",
              };
              return (
                <div key={pin.id} className="px-3 py-2"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  {/* Station row */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 font-mono"
                      style={{ border: "1px solid var(--border-bright)", color: "var(--text-muted)", background: "var(--bg-secondary)" }}>
                      {pin.label}
                    </span>
                    <span className="flex-1 truncate font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {pin.name.replace(/^stanoviště\s*/i, "") || pin.name}
                    </span>
                    <button
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 transition-colors"
                      style={STATUS_STYLE[st] ?? STATUS_STYLE.upcoming}
                      onClick={() => onStatusChange(pin.id, STATUS_ORDER[(STATUS_ORDER.indexOf(st) + 1) % STATUS_ORDER.length])}
                    >
                      {STATUS_BADGE[st]}
                    </button>
                  </div>
                  {/* Per-team status */}
                  <div className="flex flex-col gap-0.5 pl-7">
                    {teams.map(team => {
                      const tSt  = teamStationStatuses[pin.id]?.[team.id] ?? "upcoming";
                      const tCfg = TEAM_STYLE[tSt] ?? TEAM_STYLE.upcoming;
                      return (
                        <div key={team.id} className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: team.color }} />
                            <span className="font-mono text-[9px] truncate" style={{ color: "var(--text-dim)" }}>{team.name}</span>
                          </div>
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ ...tCfg, background: "transparent" }}>
                            {TEAM_LABEL[tSt]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action log */}
        <div className="cm-box flex flex-col flex-1 min-h-0">
          <SectionHeader icon={Clock} label={t("live.recentActions")} />
          <div className="overflow-y-auto flex-1">
            {log.map((a, i) => <LogEntry key={a.id ?? i} a={a} />)}
            {log.length === 0 && (
              <div className="px-3 py-4 text-xs text-center font-mono" style={{ color: "var(--text-dim)" }}>—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LiveView root ──────────────────────────────────────────────────────────
export default function LiveView({ eventId, eventData, role }) {
  const { t }    = useI18n();
  const { updateStationStatus } = useGame();
  const isOrg    = role === "Organizátor";
  const timer    = useTimer(eventData.liveState?.elapsedSeconds ?? 0, eventData.liveState?.isRunning ?? false);
  const [tab, setTab] = useState(isOrg ? "prehled" : "stanoviste");

  // Persisted station statuses from context (survive tab switches + sync across devices)
  const stationStatuses = eventData.stationStatuses ?? {};

  function handleStatusChange(pinId, status) {
    updateStationStatus(eventId, pinId, status);
  }

  return (
    <div className="flex flex-col gap-3 h-full p-3" style={{ background: "var(--bg-base)" }}>

      {/* Top bar — single row on sm+, 3 stacked rows on mobile */}
      <div className="cm-box px-3 py-2 flex flex-col sm:flex-row sm:items-center flex-shrink-0 gap-2 sm:gap-0">
        {/* Row 1 / Left: tab switch */}
        <div className="flex sm:flex-1 items-center">
          <div className="flex rounded-lg overflow-hidden w-full sm:w-auto"
            style={{ border: "1px solid var(--border-bright)", height: 36 }}>
            {[["stanoviste", t("live.stations")], ["prehled", t("live.overview")]].map(([id, label]) => (
              <button
                key={id}
                className="flex-1 sm:flex-none px-3 lg:px-4 font-mono text-xs font-bold transition-colors whitespace-nowrap"
                style={{
                  height: 36,
                  background: tab === id ? "var(--green)" : "transparent",
                  color: tab === id ? "var(--bg-base)" : "var(--text-muted)",
                }}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2 / Center: timer controls */}
        <div className="flex items-center justify-center gap-1.5 flex-shrink-0">
          <div className="font-mono font-bold tabular-nums px-3 flex items-center"
            style={{
              fontSize: 20,
              height: 36,
              border: "1px solid var(--border-bright)",
              borderRadius: 6,
              color: "var(--text-primary)",
              background: "var(--bg-secondary)",
              letterSpacing: "0.08em",
            }}>
            {timer.formatted}
          </div>
          <button className="cm-icon-btn" style={{ width: 36, height: 36, borderRadius: 6 }}
            onClick={timer.toggle} title={timer.isRunning ? t("timer.pause") : t("timer.start")}>
            {timer.isRunning ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button className="cm-icon-btn" style={{ width: 36, height: 36, borderRadius: 6 }}
            onClick={timer.reset} title={t("timer.reset")}>
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Row 3 / Right: LIVE badge */}
        <div className="flex items-center justify-center sm:justify-end sm:flex-1">
          <span className="cm-badge-live animate-pulse">{t("live.liveTag")}</span>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {tab === "stanoviste" && (
          <TabStanoviste eventId={eventId} eventData={eventData} role={role}
            stationStatuses={stationStatuses} onStatusChange={handleStatusChange} />
        )}
        {tab === "prehled" && (
          <TabPrehled eventId={eventId} eventData={eventData}
            stationStatuses={stationStatuses} onStatusChange={handleStatusChange} />
        )}
      </div>
    </div>
  );
}
