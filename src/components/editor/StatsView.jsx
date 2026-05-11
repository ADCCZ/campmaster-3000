import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
  PieChart, Pie, Cell,
} from "recharts";
import { Trophy, MapPin, TrendingUp, Users } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useTheme } from "../../context/ThemeContext";

const MEDALS = ["🥇", "🥈", "🥉"];

const STATUS_STYLE = {
  active:       s => ({ color: s.green,   border: `1px solid ${s.green}`,  background: "var(--green-glow)" }),
  disqualified: ()  => ({ color: "#ef4444", border: "1px solid #fca5a5",     background: "rgba(239,68,68,0.08)" }),
  finished:     s => ({ color: s.textDim,  border: `1px solid ${s.border}`, background: "transparent" }),
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const header = payload[0]?.payload?.fullName ?? label;
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-bright)",
      borderRadius: 6,
      padding: "8px 12px",
      fontFamily: "'Space Mono', monospace",
      fontSize: 11,
      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
      pointerEvents: "none",
    }}>
      {header && (
        <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: 4 }}>{header}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color ?? p.fill, flexShrink: 0 }} />
          <span style={{ color: "var(--text-muted)" }}>{p.name}:</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsView({ eventData, activeDay, activeStage }) {
  const { t }    = useI18n();
  const { dark } = useTheme();

  const textMuted = dark ? "#6b9c6b" : "#4a7a4a";
  const textDim   = dark ? "#3d6b3d" : "#8aaa8a";
  const border    = dark ? "#1e3a1e" : "#bddabd";
  const bgHover   = dark ? "#1c2e1c" : "#d8ecd8";
  const green     = dark ? "#22c55e" : "#16a34a";
  const s = { green, textDim, border };

  const { teams = [], pins = [], tree = [] } = eventData;
  const stationStatuses = eventData.stationStatuses ?? {};

  // Compute live stats from persisted stationStatuses
  const completedCount  = pins.filter(p => stationStatuses[p.id] === "done").length;
  const skippedCount    = pins.filter(p => stationStatuses[p.id] === "skipped").length;
  const notDoneCount    = pins.length - completedCount - skippedCount;
  const totalPinsCount  = pins.length;
  // activeDay/activeStage use -1 for "all", convert to null for logic
  const filterDay   = (activeDay  != null && activeDay  >= 0) ? activeDay  : null;
  const filterStage = (activeStage != null && activeStage >= 0) ? activeStage : null;

  const ranked     = [...teams].sort((a, b) => b.score - a.score);
  const totalScore = teams.reduce((acc, tm) => acc + (tm.score ?? 0), 0);
  const avgScore   = teams.length ? Math.round(totalScore / teams.length) : 0;

  const stats = {
    totalPins:    totalPinsCount,
    donePins:     completedCount,
    completed:    totalPinsCount > 0 ? Math.round(completedCount / totalPinsCount * 100) : 0,
    notCompleted: totalPinsCount > 0 ? Math.round(notDoneCount   / totalPinsCount * 100) : 0,
    skipped:      totalPinsCount > 0 ? Math.round(skippedCount   / totalPinsCount * 100) : 0,
  };

  // Filtered pins
  const filteredPins = useMemo(() => {
    if (filterDay === null) return pins;
    return pins.filter(p =>
      p.day === filterDay && (filterStage === null || p.stage === filterStage)
    );
  }, [pins, filterDay, filterStage]);

  const isFiltered = filterDay !== null;
  const maxPts = filteredPins.reduce((a, p) => a + (p.maxPoints ?? 0), 0);
  const avgPts = filteredPins.length ? Math.round(maxPts / filteredPins.length) : 0;

  // Bar chart data — team scores (global) or pin maxPoints (filtered)
  const barData = isFiltered
    ? [...filteredPins].sort((a, b) => a.order - b.order).map(p => ({
        name:     p.label,
        fullName: p.name,
        score:    p.maxPoints ?? 0,
        fill:     green,
      }))
    : ranked.map(tm => ({
        name:  tm.name,
        score: tm.score ?? 0,
        fill:  tm.color ?? green,
      }));

  const barTitle = isFiltered
    ? (filterStage !== null
        ? (tree[filterDay]?.stages?.[filterStage]?.label ?? "Etapa")
        : (tree[filterDay]?.label ?? "Den"))
    : t("stats.teamScores");

  // Stat cards — switch values when filtered
  const statCards = isFiltered ? [
    { icon: MapPin,     label: "Stanovišť v etapě", value: filteredPins.length, accent: false },
    { icon: Trophy,     label: "Max. bodů v etapě", value: maxPts,              accent: true  },
    { icon: TrendingUp, label: "Průměr max. bodů",  value: avgPts,              accent: false },
    { icon: Users,      label: "Počet týmů",         value: teams.length,        accent: false },
  ] : [
    { icon: MapPin,     label: t("stats.totalPins"),  value: stats.totalPins ?? pins.length,  accent: false },
    { icon: Trophy,     label: t("stats.donePins"),   value: stats.donePins  ?? 0,            accent: true  },
    { icon: TrendingUp, label: t("stats.totalScore"), value: totalScore.toLocaleString("cs"), accent: true  },
    { icon: Users,      label: t("stats.avgScore"),   value: avgScore,                        accent: false },
  ];

  const pieData = [
    { name: t("stats.completed"),    value: stats.completed    ?? 0, color: green },
    { name: t("stats.notCompleted"), value: stats.notCompleted ?? 0, color: dark ? "#4b5563" : "#9ca3af" },
    { name: t("stats.skipped"),      value: stats.skipped      ?? 0, color: dark ? "#374151" : "#d1d5db" },
  ].filter(d => d.value > 0);

  const chartHeight = Math.max(180, barData.length * 46 + 24);

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: "var(--bg-base)" }}>
      <div className="flex flex-col gap-4">

        {/* ── Stat cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(({ icon: Icon, label, value, accent }) => (
            <div key={label} className="cm-box px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon size={12} style={{ color: accent ? green : textMuted, flexShrink: 0 }} />
                <span className="cm-label truncate" style={{ fontSize: 10, letterSpacing: "0.08em" }}>{label}</span>
              </div>
              <div className="font-mono font-bold tabular-nums flex-shrink-0"
                style={{ fontSize: 24, lineHeight: 1, color: accent ? green : "var(--text-primary)" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Bar chart */}
          <div className="cm-box lg:col-span-2 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <Trophy size={12} style={{ color: green }} />
              <span className="cm-label" style={{ fontSize: 11 }}>{barTitle}</span>
            </div>
            <div className="p-4" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 4, right: 52, left: 4, bottom: 4 }}
                  barSize={20}
                >
                  <XAxis
                    type="number"
                    tick={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fill: textDim }}
                    axisLine={{ stroke: border }}
                    tickLine={{ stroke: border }}
                    domain={[0, "dataMax"]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={isFiltered ? 30 : 104}
                    tick={{ fontFamily: "'Space Mono',monospace", fontSize: 10, fill: textMuted }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: bgHover, opacity: 0.5 }} />
                  <Bar dataKey="score" name={isFiltered ? "Max. body" : t("stats.score")} radius={[0, 3, 3, 0]}>
                    <LabelList
                      dataKey="score"
                      position="right"
                      style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, fill: textDim }}
                    />
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut chart */}
          <div className="cm-box flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <TrendingUp size={12} style={{ color: green }} />
              <span className="cm-label" style={{ fontSize: 11 }}>{t("stats.completedTasks")}</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={44} outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full space-y-2">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                          <span className="font-mono text-xs truncate" style={{ color: textMuted }}>{d.name}</span>
                        </div>
                        <span className="font-mono text-xs font-bold tabular-nums flex-shrink-0"
                          style={{ color: "var(--text-primary)" }}>
                          {d.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <span className="font-mono text-xs" style={{ color: textDim }}>—</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Ranking table (only global view) ────────────────────── */}
        {!isFiltered && (
          <div className="cm-box">
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <Trophy size={12} style={{ color: green }} />
              <span className="cm-label" style={{ fontSize: 11 }}>{t("stats.ranking")}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="font-mono text-sm border-collapse" style={{ minWidth: 480, width: "100%" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                    {["#", t("live.team"), t("teams.col.score"), "Status", t("teams.col.leader") || "Vedoucí"].map(h => (
                      <th key={h} className={`px-3 py-2 text-xs font-bold uppercase tracking-wider text-left whitespace-nowrap${h === t("teams.col.score") ? " text-right" : ""}`}
                        style={{ color: textMuted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((team, i) => (
                    <tr key={team.id} style={{
                      borderBottom: "1px solid var(--border)",
                      background: i % 2 === 1 ? "var(--bg-secondary)" : "transparent",
                      opacity: team.status === "disqualified" ? 0.5 : 1,
                    }}>
                      <td className="px-3 py-2.5 font-bold text-base" style={{ width: 36, color: i < 3 ? green : textDim }}>
                        {MEDALS[i] ?? `${i + 1}.`}
                      </td>
                      <td className="px-3 py-2.5 font-bold" style={{ color: "var(--text-primary)" }}>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ background: team.color, border: "1px solid rgba(255,255,255,0.15)" }} />
                          {team.name}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-bold tabular-nums text-right"
                        style={{ color: i === 0 ? green : "var(--text-primary)" }}>
                        {(team.score ?? 0).toLocaleString("cs")}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono whitespace-nowrap"
                          style={(STATUS_STYLE[team.status] ?? STATUS_STYLE.finished)(s)}>
                          {t(`teams.status.${team.status}`) || team.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: textMuted }}>
                        {team.vedouci || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
