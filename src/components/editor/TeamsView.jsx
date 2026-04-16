import { useState, useMemo } from "react";
import { Search, Plus, Edit2, Trash2, X } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useGame } from "../../context/GameContext";
import ConfirmDialog from "../common/ConfirmDialog";
import CustomSelect from "../common/CustomSelect";
import { validateRequired, tError } from "../../utils/validation";

// ── Status badge ───────────────────────────────────────────────────────────
const STATUS_STYLE = {
  active:       { color: "var(--green)",    border: "1px solid var(--green)",  background: "var(--green-glow)" },
  disqualified: { color: "#ef4444",         border: "1px solid #fca5a5",       background: "rgba(239,68,68,0.08)" },
  finished:     { color: "var(--text-dim)", border: "1px solid var(--border)", background: "transparent" },
};

function StatusBadge({ status, canEdit, onChange }) {
  const { t } = useI18n();
  const opts = ["active", "disqualified", "finished"];
  if (!canEdit) {
    const s = STATUS_STYLE[status] ?? STATUS_STYLE.active;
    return (
      <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-full whitespace-nowrap" style={s}>
        {t(`teams.status.${status}`)}
      </span>
    );
  }
  return (
    <CustomSelect
      value={status}
      onChange={v => onChange(v)}
      options={opts.map(o => ({ value: o, label: t(`teams.status.${o}`) }))}
      style={{ minWidth: 130 }}
    />
  );
}

// ── Color swatch (table cell) ──────────────────────────────────────────────
function ColorCell({ color, canEdit, onChange }) {
  return (
    <label className="relative flex items-center justify-center cursor-pointer">
      <div className="w-5 h-5 rounded-full flex-shrink-0"
        style={{ background: color, border: "2px solid var(--border-bright)" }} />
      {canEdit && (
        <input type="color" className="sr-only" value={color} onChange={e => onChange(e.target.value)} />
      )}
    </label>
  );
}

// ── Score cell ─────────────────────────────────────────────────────────────
function ScoreCell({ score, max, canEdit, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(String(score));
  const pct = max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;

  if (editing) return (
    <input
      className="cm-input font-mono text-xs w-20"
      value={draft} autoFocus type="text" inputMode="numeric" maxLength={6}
      onChange={e => setDraft(e.target.value.replace(/\D/g, ""))}
      onKeyDown={e => {
        if (e.key === "Enter")  { onChange(draft); setEditing(false); }
        if (e.key === "Escape") setEditing(false);
      }}
      onBlur={() => { onChange(draft); setEditing(false); }}
    />
  );

  return (
    <div
      className={`flex items-center justify-center gap-2 ${canEdit ? "cursor-pointer group" : ""}`}
      title={canEdit ? "Klikni pro úpravu" : undefined}
      onClick={() => canEdit && (setDraft(String(score)), setEditing(true))}
    >
      <span className="font-bold text-right tabular-nums text-sm" style={{ color: "var(--text-primary)", minWidth: 52 }}>
        {score}
      </span>
      <div className="w-16 h-2 rounded-sm overflow-hidden"
        style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
        <div className="h-full transition-all rounded-sm" style={{ width: `${pct}%`, background: "var(--green)" }} />
      </div>
      {canEdit && (
        <Edit2 size={9} className="opacity-20 group-hover:opacity-60 transition-opacity flex-shrink-0"
          style={{ color: "var(--green)" }} />
      )}
    </div>
  );
}

// ── Character counter ──────────────────────────────────────────────────────
function CharCount({ value, max }) {
  const len = value.length;
  const pct = len / max;
  const color = pct >= 1 ? "#ef4444" : pct >= 0.85 ? "#f59e0b" : "var(--text-dim)";
  return (
    <span className="font-mono text-[10px]" style={{ color }}>{len}/{max}</span>
  );
}

// ── Team dialog ────────────────────────────────────────────────────────────
function TeamDialog({ team, onSave, onClose, t }) {
  const [form,   setForm]   = useState({
    name:     team?.name     ?? "",
    vedouci:  team?.vedouci  ?? "",
    category: team?.category ?? "",
    members:  team?.members  != null ? String(team.members) : "",
    score:    team?.score    != null ? String(team.score)   : "0",
    color:    team?.color    ?? "#22c55e",
    note:     team?.note     ?? "",
  });
  const [errors, setErrors] = useState({});

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: null })); }

  function handleSave() {
    const membersNum = form.members === "" ? 0 : Number(form.members);
    const scoreNum   = form.score   === "" ? 0 : Number(form.score);
    const e = {
      name:    tError(t, validateRequired(form.name)),
      members: (!Number.isInteger(membersNum) || membersNum < 0)
        ? "Musí být nezáporné celé číslo" : null,
      score:   (isNaN(scoreNum) || scoreNum < 0)
        ? "Musí být nezáporné číslo" : null,
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    onSave({
      name:     form.name.trim(),
      vedouci:  form.vedouci.trim(),
      category: form.category.trim(),
      members:  membersNum,
      score:    scoreNum,
      color:    form.color,
      note:     form.note.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,.6)" }}>
      <div
        className="cm-box w-full mx-4 shadow-2xl"
        style={{ maxWidth: 660, background: "var(--bg-card)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="cm-label" style={{ fontSize: 15 }}>{t("teams.dialog.title")}</span>
          <button
            className="rounded p-1.5 transition-colors" style={{ color: "var(--text-dim)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div className="cm-field">
            <div className="flex items-center justify-between mb-1">
              <label className="cm-field-label" style={{ fontSize: 13 }}>{t("teams.dialog.name")} *</label>
              <CharCount value={form.name} max={60} />
            </div>
            <input
              className={`cm-input ${errors.name ? "cm-input-error" : ""}`}
              style={{ height: 46, fontSize: 15 }}
              placeholder={t("teams.dialog.namePlaceholder")}
              value={form.name} maxLength={60}
              onChange={e => setF("name", e.target.value)}
            />
            {errors.name && <span className="cm-error">{errors.name}</span>}
          </div>

          {/* Leader + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="cm-field">
              <div className="flex items-center justify-between mb-1">
                <label className="cm-field-label" style={{ fontSize: 13 }}>{t("teams.dialog.leader")}</label>
                <CharCount value={form.vedouci} max={60} />
              </div>
              <input className="cm-input" style={{ height: 46, fontSize: 15 }}
                placeholder={t("teams.dialog.leaderPlaceholder")}
                value={form.vedouci} maxLength={60}
                onChange={e => setF("vedouci", e.target.value)} />
            </div>
            <div className="cm-field">
              <div className="flex items-center justify-between mb-1">
                <label className="cm-field-label" style={{ fontSize: 13 }}>{t("teams.dialog.category")}</label>
                <CharCount value={form.category} max={40} />
              </div>
              <input className="cm-input" style={{ height: 46, fontSize: 15 }}
                placeholder={t("teams.dialog.categoryPlaceholder")}
                value={form.category} maxLength={40}
                onChange={e => setF("category", e.target.value)} />
            </div>
          </div>

          {/* Members + Score + Color */}
          <div className="grid grid-cols-3 gap-4">
            <div className="cm-field">
              <label className="cm-field-label block mb-1" style={{ fontSize: 13 }}>{t("teams.dialog.members")}</label>
              <input
                className={`cm-input ${errors.members ? "cm-input-error" : ""}`}
                style={{ height: 46, fontSize: 15 }}
                type="number" min="0" max="999"
                value={form.members}
                onChange={e => setF("members", e.target.value)}
              />
              {errors.members && <span className="cm-error">{errors.members}</span>}
            </div>
            <div className="cm-field">
              <label className="cm-field-label block mb-1" style={{ fontSize: 13 }}>{t("teams.col.score")}</label>
              <input
                className={`cm-input ${errors.score ? "cm-input-error" : ""}`}
                style={{ height: 46, fontSize: 15 }}
                type="text" inputMode="numeric" maxLength={6}
                value={form.score}
                onChange={e => setF("score", e.target.value.replace(/\D/g, ""))}
              />
              {errors.score && <span className="cm-error">{errors.score}</span>}
            </div>
            <div className="cm-field">
              <label className="cm-field-label block mb-1" style={{ fontSize: 13 }}>{t("teams.dialog.color")}</label>
              <div
                className="relative flex items-center gap-3 cursor-pointer rounded-lg px-3"
                style={{ height: 46, border: "1px solid var(--border)", background: "var(--bg-secondary)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--green)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div className="w-7 h-7 rounded-md flex-shrink-0 pointer-events-none"
                  style={{ background: form.color, border: "2px solid var(--border-bright)" }} />
                <span className="font-mono text-sm flex-1 pointer-events-none" style={{ color: "var(--text-muted)" }}>
                  {form.color}
                </span>
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setF("color", e.target.value)}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="cm-field">
            <div className="flex items-center justify-between mb-1">
              <label className="cm-field-label" style={{ fontSize: 13 }}>{t("teams.dialog.note")}</label>
              <CharCount value={form.note} max={200} />
            </div>
            <textarea
              className="cm-input"
              style={{ height: 69, fontSize: 15, resize: "none", paddingTop: 10, paddingBottom: 10 }}
              placeholder={t("teams.dialog.notePlaceholder")}
              value={form.note} maxLength={200}
              onChange={e => setF("note", e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-1">
            <button className="cm-btn" style={{ height: 46, fontSize: 15 }} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button className="cm-btn-primary" style={{ height: 46, fontSize: 15 }} onClick={handleSave}>
              {t("common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Main TeamsView ─────────────────────────────────────────────────────────
export default function TeamsView({ eventId, eventData, role }) {
  const { t } = useI18n();
  const { addTeam, updateTeam, deleteTeam, setScore } = useGame();
  const isOrganizator = role === "Organizátor";

  const [search,       setSearch]      = useState("");
  const [editingTeam,  setEditingTeam] = useState(null);
  const [delTarget,    setDelTarget]   = useState(null);
  const [expandedNote, setExpandedNote] = useState(null);

  const teams = eventData.teams ?? [];
  const maxScore = useMemo(() => Math.max(...teams.map(t => t.score ?? 0), 1), [teams]);
  const filtered = useMemo(
    () => teams.filter(tm =>
      tm.name.toLowerCase().includes(search.toLowerCase()) ||
      (tm.vedouci ?? "").toLowerCase().includes(search.toLowerCase())
    ),
    [teams, search]
  );

  function handleSaveTeam(data) {
    if (editingTeam === "new") {
      addTeam(eventId, { id: `t${Date.now()}`, score: 0, max: 0, status: "active", ...data });
    } else {
      updateTeam(eventId, editingTeam, data);
    }
    setEditingTeam(null);
  }

  const teamForEdit = editingTeam && editingTeam !== "new"
    ? teams.find(tm => tm.id === editingTeam) : null;

  const COLS = [
    t("teams.col.name"), t("teams.col.color"), t("teams.col.leader"),
    t("teams.col.category"), t("teams.col.members"), t("teams.col.status"),
    t("teams.col.score"), t("teams.col.note"), t("teams.col.actions"),
  ];

  return (
    <div className="h-full flex flex-col min-h-0 p-4 gap-3" style={{ background: "var(--bg-base)" }}>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-dim)" }} />
          <input className="cm-input pl-8" placeholder={t("teams.search")}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isOrganizator && (
          <button className="cm-btn-primary flex-shrink-0" onClick={() => setEditingTeam("new")}>
            <Plus size={14} /> {t("teams.addTeam")}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg"
        style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
        <table className="font-mono text-sm border-collapse min-w-max w-full" style={{ textAlign: "center" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              {COLS.map((h, i) => (
                <th key={h}
                  className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: "var(--text-muted)", width: "1px" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((team, idx) => (
              <tr key={team.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  opacity: team.status === "disqualified" ? 0.55 : 1,
                  background: idx % 2 === 1 ? "var(--bg-secondary)" : "transparent",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? "var(--bg-secondary)" : "transparent"}
              >
                <td className="px-3 py-2.5 font-bold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                  {team.name}
                </td>
                <td className="px-2 py-2.5" style={{ textAlign: "center" }}>
                  <ColorCell color={team.color} canEdit={isOrganizator}
                    onChange={v => updateTeam(eventId, team.id, { color: v })} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {team.vedouci || "—"}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {team.category || "—"}
                </td>
                <td className="px-3 py-2.5 text-center" style={{ color: "var(--text-muted)" }}>
                  {team.members}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={team.status} canEdit={isOrganizator}
                    onChange={v => updateTeam(eventId, team.id, { status: v })} />
                </td>
                <td className="px-3 py-2.5" style={{ textAlign: "center" }}>
                  <ScoreCell score={team.score} max={maxScore} canEdit={isOrganizator}
                    onChange={v => setScore(eventId, team.id, v)} />
                </td>
                <td
                  className={`px-3 py-2.5 text-xs italic ${expandedNote === team.id ? "whitespace-normal max-w-xs" : "max-w-48 truncate"}`}
                  style={{ color: "var(--text-dim)", cursor: team.note ? "pointer" : "default" }}
                  onClick={() => team.note && setExpandedNote(expandedNote === team.id ? null : team.id)}
                  title={expandedNote === team.id ? undefined : (team.note || undefined)}
                >
                  {team.note || "—"}
                </td>
                <td className="px-3 py-2.5">
                  {isOrganizator ? (
                    <div className="flex gap-1.5 justify-center">
                      <button
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded transition-colors"
                        style={{ border: "1px solid var(--border-bright)", color: "var(--text-muted)", background: "transparent" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.color = "var(--green)"; e.currentTarget.style.background = "var(--green-glow)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-bright)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                        onClick={() => setEditingTeam(team.id)}
                      >
                        <Edit2 size={10} /> {t("teams.edit")}
                      </button>
                      <button
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded transition-colors"
                        style={{ border: "1px solid #fca5a5", color: "#ef4444", background: "rgba(239,68,68,0.06)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
                        onClick={() => setDelTarget(team.id)}
                      >
                        <Trash2 size={10} /> {t("teams.delete")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ border: "1px solid var(--border)", color: "var(--text-dim)" }}>
                        {t("teams.readOnly")}
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-3 py-2 text-xs font-mono"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-dim)" }}>
          {t("teams.showing", filtered.length, teams.length)}
        </div>
      </div>

      {editingTeam && (
        <TeamDialog team={teamForEdit} onSave={handleSaveTeam}
          onClose={() => setEditingTeam(null)} t={t} />
      )}
      {delTarget && (
        <ConfirmDialog
          message={`Opravdu smazat tým "${teams.find(tm => tm.id === delTarget)?.name}"?`}
          onConfirm={() => { deleteTeam(eventId, delTarget); setDelTarget(null); }}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}
