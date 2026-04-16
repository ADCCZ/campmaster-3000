import { useState } from "react";
import { Play, Pause, RotateCcw, Trophy, Clock, AlertTriangle, MapPin } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useGame } from "../../context/GameContext";
import { useTimer } from "../../hooks/useTimer";

const MEDALS = ["🥇", "🥈", "🥉"];
const STATUS_ORDER = ["active", "done", "skipped"];

// ── Status pill ────────────────────────────────────────────────────────────
function StatusPill({ status, active, onClick }) {
  const { t } = useI18n();
  const labels = { active: t("live.status.active"), done: t("live.status.done"), skipped: t("live.status.skipped") };
  const styles = {
    active:  active ? { border: "1px solid var(--green)",         color: "var(--green)",       background: "var(--green-glow)" }
                    : { border: "1px solid var(--border)",         color: "var(--text-dim)",     background: "transparent" },
    done:    active ? { border: "1px solid var(--border-bright)", color: "var(--text-primary)", background: "var(--bg-hover)" }
                    : { border: "1px solid var(--border)",         color: "var(--text-dim)",     background: "transparent" },
    skipped: active ? { border: "1px solid var(--border)",        color: "var(--text-muted)",   background: "var(--bg-secondary)" }
                    : { border: "1px solid var(--border)",         color: "var(--text-dim)",     background: "transparent" },
  };
  return (
    <button
      className="text-[10px] font-mono px-2.5 py-1 rounded transition-colors"
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
          {a.delta} b.
        </span>
      </div>
      <div className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{a.team}</div>
      <div className="text-[10px] truncate" style={{ color: "var(--text-dim)" }}>{a.station}</div>
    </div>
  );
}

// ── Tab: Stanoviště ────────────────────────────────────────────────────────
function TabStanoviste({ eventId, eventData, role, stationStatuses, setStationStatuses }) {
  const { t }    = useI18n();
  const { adjustScore, addLogEntry } = useGame();
  const isOrg    = role === "Organizátor";
  const allPins  = eventData.pins ?? [];
  const myPins   = isOrg ? allPins : allPins.filter(p => p.vedouci === role);
  const teams    = eventData.teams ?? [];

  const [activeStationId, setActiveStationId] = useState(myPins[0]?.id ?? null);
  const [alertSent, setAlertSent] = useState({});
  const [note, setNote] = useState("");
  const [log, setLog]   = useState(eventData.actionLog ?? []);

  const activePin = allPins.find(p => p.id === activeStationId) ?? myPins[0] ?? null;
  const stStatus  = activePin ? (stationStatuses[activePin.id] ?? "active") : "active";

  function adjust(team, delta) {
    adjustScore(eventId, team.id, delta);
    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    const entry = { time, team: team.name, delta: `${delta > 0 ? "+" : ""}${delta}`, station: activePin?.name ?? "" };
    setLog(prev => [entry, ...prev].slice(0, 50));
    addLogEntry(eventId, entry);
  }

  return (
    <div className="flex gap-3 flex-1 min-h-0">

      {/* Station list */}
      <div className="cm-box flex-shrink-0 flex flex-col" style={{ width: 208 }}>
        <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="cm-label" style={{ fontSize: 10 }}>{t("live.myStations")}</span>
          {!isOrg && <span className="cm-tag text-[9px]">{role}</span>}
        </div>
        <div className="overflow-y-auto flex-1">
          {myPins.map(pin => {
            const st    = stationStatuses[pin.id] ?? "active";
            const isAct = pin.id === activeStationId;
            return (
              <button
                key={pin.id}
                className="w-full text-left px-3 py-2.5 font-mono text-xs flex items-center gap-2 transition-colors"
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
                <span className="flex-1 truncate">{pin.name.split("—")[1]?.trim() ?? pin.name}</span>
                {st === "done"    && <span style={{ color: "var(--green)",    fontSize: 9 }}>✓</span>}
                {st === "skipped" && <span style={{ color: "var(--text-dim)", fontSize: 9 }}>—</span>}
              </button>
            );
          })}
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
            <div className="cm-box p-4 flex items-start gap-3 flex-wrap">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 font-mono"
                style={{ background: "var(--green)", color: "var(--bg-base)" }}>
                {activePin.label}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono font-bold text-sm" style={{ color: "var(--text-primary)" }}>{activePin.name}</div>
                {activePin.vedouci && (
                  <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>🧑‍🏫 {activePin.vedouci}</div>
                )}
                {activePin.description && (
                  <div className="font-mono text-[10px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{activePin.description}</div>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0 flex-wrap">
                {STATUS_ORDER.map(k => (
                  <StatusPill key={k} status={k} active={stStatus === k}
                    onClick={() => setStationStatuses(prev => ({ ...prev, [activePin.id]: k }))} />
                ))}
              </div>
              <button
                className="font-mono text-xs px-3 py-1 flex items-center gap-1.5 flex-shrink-0 rounded transition-colors"
                style={alertSent[activePin.id]
                  ? { border: "1px solid var(--border)", color: "var(--text-dim)", background: "transparent" }
                  : { border: "1px solid #fca5a5", color: "#ef4444", background: "rgba(239,68,68,0.06)" }}
                onMouseEnter={e => { if (!alertSent[activePin.id]) e.currentTarget.style.background = "rgba(239,68,68,0.14)"; }}
                onMouseLeave={e => { if (!alertSent[activePin.id]) e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                onClick={() => setAlertSent(prev => ({ ...prev, [activePin.id]: true }))}
              >
                <AlertTriangle size={11} />
                {alertSent[activePin.id] ? t("live.problemSent") : t("live.problem")}
              </button>
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {teams.map(team => (
                <div key={team.id} className="cm-box p-4 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: team.color }} />
                    <span className="font-mono font-bold text-sm" style={{ color: "var(--text-muted)" }}>{team.name}</span>
                  </div>
                  <div className="font-mono font-black tabular-nums"
                    style={{ fontSize: 44, lineHeight: 1, color: "var(--text-primary)" }}>
                    {(team.score ?? 0).toLocaleString("cs")}
                  </div>
                  <span className="cm-label" style={{ fontSize: 10 }}>{t("live.points")}</span>
                  <div className="grid grid-cols-4 gap-1.5 w-full">
                    {[[-10, false], [-5, false], [+5, true], [+10, true]].map(([d, pos]) => (
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
              ))}
            </div>

            {/* Note */}
            <div className="cm-box p-4">
              <label className="cm-label block mb-2" style={{ fontSize: 10 }}>{t("live.noteLabel")}</label>
              <div className="flex gap-2">
                <input className="cm-input" placeholder={t("live.notePlaceholder")}
                  value={note} onChange={e => setNote(e.target.value)} />
                <button className="cm-btn flex-shrink-0" style={{ height: 42, fontSize: 13 }}
                  onClick={() => setNote("")}>
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

      {/* Action log */}
      <div className="cm-box flex-shrink-0 flex flex-col" style={{ width: 208 }}>
        <SectionHeader icon={Clock} label={t("live.recentActions")} />
        <div className="overflow-y-auto flex-1">
          {log.map((a, i) => <LogEntry key={i} a={a} />)}
          {log.length === 0 && (
            <div className="px-3 py-4 text-xs text-center font-mono" style={{ color: "var(--text-dim)" }}>—</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Přehled ───────────────────────────────────────────────────────────
function TabPrehled({ eventId, eventData, stationStatuses, setStationStatuses }) {
  const { t }  = useI18n();
  const teams  = eventData.teams ?? [];
  const pins   = eventData.pins  ?? [];
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const log    = eventData.actionLog ?? [];

  const STATUS_BADGE = {
    active:  t("live.status.active"),
    done:    t("live.status.done"),
    skipped: t("live.status.skipped"),
  };
  const STATUS_STYLE = {
    active:  { color: "var(--green)",    border: "1px solid var(--green)",        background: "var(--green-glow)" },
    done:    { color: "var(--text-muted)", border: "1px solid var(--border-bright)", background: "var(--bg-hover)" },
    skipped: { color: "var(--text-dim)", border: "1px solid var(--border)",        background: "transparent" },
  };

  return (
    <div className="flex gap-3 flex-1 min-h-0">

      {/* Ranking table */}
      <div className="cm-box flex-1 flex flex-col min-h-0">
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

      {/* Right column */}
      <div className="flex flex-col gap-3 flex-shrink-0" style={{ width: 256 }}>

        {/* Station status — clickable to cycle through states */}
        <div className="cm-box flex-shrink-0 flex flex-col" style={{ maxHeight: "55%" }}>
          <SectionHeader icon={MapPin} label={t("live.stationStatus")} />
          <div className="overflow-y-auto flex-1">
            {pins.map(pin => {
              const st  = stationStatuses[pin.id] ?? "active";
              return (
                <div key={pin.id} className="flex items-center gap-2 px-3 py-2"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 font-mono"
                    style={{ border: "1px solid var(--border-bright)", color: "var(--text-muted)", background: "var(--bg-secondary)" }}>
                    {pin.label}
                  </span>
                  <span className="flex-1 truncate font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                    {pin.name.split("—")[1]?.trim() ?? pin.name}
                  </span>
                  <button
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 transition-colors"
                    style={STATUS_STYLE[st] ?? STATUS_STYLE.active}
                    onClick={() => setStationStatuses(prev => ({
                      ...prev,
                      [pin.id]: STATUS_ORDER[(STATUS_ORDER.indexOf(st) + 1) % STATUS_ORDER.length],
                    }))}
                  >
                    {STATUS_BADGE[st]}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action log */}
        <div className="cm-box flex flex-col flex-1 min-h-0">
          <SectionHeader icon={Clock} label={t("live.recentActions")} />
          <div className="overflow-y-auto flex-1">
            {log.map((a, i) => <LogEntry key={i} a={a} />)}
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
  const isOrg    = role === "Organizátor";
  const timer    = useTimer(eventData.liveState?.elapsedSeconds ?? 0, eventData.liveState?.isRunning ?? false);
  const [tab, setTab] = useState(isOrg ? "prehled" : "stanoviste");

  // Shared station statuses between both tabs
  const allPins = eventData.pins ?? [];
  const [stationStatuses, setStationStatuses] = useState(
    () => Object.fromEntries(allPins.map(p => [p.id, "active"]))
  );

  return (
    <div className="flex flex-col gap-3 h-full p-3" style={{ background: "var(--bg-base)" }}>

      {/* Top bar */}
      <div className="cm-box px-4 py-2.5 flex items-center gap-3 flex-shrink-0 flex-wrap">
        {/* Tab switch */}
        <div className="flex rounded-lg overflow-hidden flex-shrink-0"
          style={{ border: "1px solid var(--border-bright)", height: 38 }}>
          {[["stanoviste", t("live.stations")], ["prehled", t("live.overview")]].map(([id, label]) => (
            <button
              key={id}
              className="px-4 font-mono text-xs font-bold transition-colors whitespace-nowrap"
              style={{
                height: 38,
                background: tab === id ? "var(--green)" : "transparent",
                color: tab === id ? "var(--bg-base)" : "var(--text-muted)",
              }}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="font-mono font-bold tabular-nums px-4 flex items-center"
            style={{
              fontSize: 22,
              height: 38,
              border: "1px solid var(--border-bright)",
              borderRadius: 6,
              color: "var(--text-primary)",
              background: "var(--bg-secondary)",
              letterSpacing: "0.08em",
            }}>
            {timer.formatted}
          </div>
          <button className="cm-icon-btn" style={{ width: 38, height: 38, borderRadius: 6 }}
            onClick={timer.toggle} title={timer.isRunning ? t("timer.pause") : t("timer.start")}>
            {timer.isRunning ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button className="cm-icon-btn" style={{ width: 38, height: 38, borderRadius: 6 }}
            onClick={timer.reset} title={t("timer.reset")}>
            <RotateCcw size={15} />
          </button>
        </div>

        <span className="cm-badge-live ml-auto animate-pulse">{t("live.liveTag")}</span>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {tab === "stanoviste" && (
          <TabStanoviste eventId={eventId} eventData={eventData} role={role}
            stationStatuses={stationStatuses} setStationStatuses={setStationStatuses} />
        )}
        {tab === "prehled" && (
          <TabPrehled eventId={eventId} eventData={eventData}
            stationStatuses={stationStatuses} setStationStatuses={setStationStatuses} />
        )}
      </div>
    </div>
  );
}
