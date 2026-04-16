import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useGame } from "../../context/GameContext";
import ModalShell from "../common/ModalShell";
import CustomSelect from "../common/CustomSelect";
import {
  validateRequired, validateDate, validatePositiveNumber,
  validateNonNegativeInteger, tError,
} from "../../utils/validation";

function Field({ label, error, children }) {
  return (
    <div className="cm-field">
      <label className="cm-field-label">{label}</label>
      {children}
      {error && <span className="cm-error">{error}</span>}
    </div>
  );
}

const STEPS = ["wizard.step1", "wizard.step2", "wizard.step3"];

export default function NewGameWizard({ onClose, onCreated }) {
  const { t } = useI18n();
  const { addEvent } = useGame();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  // Form state
  const [form, setForm] = useState({
    name: "", dateStart: "", dateEnd: "", location: "", type: "Bodovací",
    teamCount: "4", maxPlayers: "8",
  });
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: null }));
  }

  // ── Validate step 1 ──
  function validateStep1() {
    const e = {};
    e.name      = tError(t, validateRequired(form.name));
    e.dateStart = tError(t, validateDate(form.dateStart));
    e.dateEnd   = tError(t, validateDate(form.dateEnd));
    setErrors(e);
    return !Object.values(e).some(Boolean);
  }

  // ── Validate step 2 ──
  function validateStep2() {
    const e = {};
    e.teamCount  = tError(t, validatePositiveNumber(form.teamCount));
    e.maxPlayers = tError(t, validatePositiveNumber(form.maxPlayers));
    setErrors(e);
    return !Object.values(e).some(Boolean);
  }

  function handleNext() {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    if (step < STEPS.length - 1) setStep(s => s + 1);
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1); else onClose();
  }

  function addTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    const colors = ["#ef4444","#3b82f6","#22c55e","#eab308","#8b5cf6","#f97316","#06b6d4","#ec4899"];
    setTeams(prev => [...prev, {
      id: `t${Date.now()}`,
      name,
      color: colors[prev.length % colors.length],
      members: 0, score: 0, max: 100, vedouci: "", category: "", status: "active", note: "",
    }]);
    setNewTeamName("");
  }

  function handleCreate() {
    const id = `game-${Date.now()}`;
    const defaultTeams = teams.length > 0 ? teams : Array.from({ length: Number(form.teamCount) || 4 }, (_, i) => {
      const colors = ["#ef4444","#3b82f6","#22c55e","#eab308","#8b5cf6","#f97316","#06b6d4","#ec4899"];
      return {
        id: `t${i}`, name: `Tým ${i + 1}`, color: colors[i % colors.length],
        members: Number(form.maxPlayers) || 8,
        score: 0, max: 0, vedouci: "", category: "", status: "active", note: "",
      };
    });
    addEvent({
      id, name: form.name, icon: "⛺",
      dates: `${form.dateStart} – ${form.dateEnd}`,
      createdAt: new Date().toISOString(),
      location: form.location, type: form.type, status: "active",
      pins: [], tree: [], teams: defaultTeams,
      stats: { completed: 0, notCompleted: 0, skipped: 0, totalPins: 0, donePins: 0, totalScore: 0, avgScore: 0 },
      liveState: { isRunning: false, startTime: null, elapsedSeconds: 0 },
      actionLog: [],
    });
    onClose();
    if (onCreated) onCreated(id);
  }

  return (
    <ModalShell title={t("wizard.title")} onClose={onClose} width="max-w-lg">
      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
              style={{
                background: i < step ? "var(--green)" : i === step ? "var(--bg-secondary)" : "transparent",
                borderColor: i < step || i === step ? "var(--green)" : "var(--border)",
                color: i < step ? (document.documentElement.classList.contains("dark") ? "#0a0f0a" : "#fff") : i === step ? "var(--green)" : "var(--text-dim)",
              }}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <div className="ml-1 mr-2 font-mono text-xs hidden sm:block">
              <span style={{ color: i === step ? "var(--text-primary)" : "var(--text-dim)", fontWeight: i === step ? 700 : 400 }}>
                {t(s)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1"
                style={{ background: i < step ? "var(--green)" : "var(--border)" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 0 && (
        <div className="space-y-3 font-mono">
          <div className="cm-label">{t("wizard.step1Title")}</div>
          <Field label={t("wizard.eventName")} error={errors.name}>
            <input className={`cm-input ${errors.name ? "cm-input-error" : ""}`}
              placeholder={t("wizard.eventNamePlaceholder")}
              value={form.name} onChange={e => setField("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("wizard.dateStart")} error={errors.dateStart}>
              <input className={`cm-input ${errors.dateStart ? "cm-input-error" : ""}`}
                placeholder={t("wizard.datePlaceholder")}
                value={form.dateStart} onChange={e => setField("dateStart", e.target.value)} />
            </Field>
            <Field label={t("wizard.dateEnd")} error={errors.dateEnd}>
              <input className={`cm-input ${errors.dateEnd ? "cm-input-error" : ""}`}
                placeholder={t("wizard.datePlaceholder")}
                value={form.dateEnd} onChange={e => setField("dateEnd", e.target.value)} />
            </Field>
          </div>
          <Field label={t("wizard.location")}>
            <input className="cm-input" placeholder={t("wizard.locationPlaceholder")}
              value={form.location} onChange={e => setField("location", e.target.value)} />
          </Field>
          <Field label={t("wizard.gameType")}>
            <CustomSelect
              className="w-full"
              value={form.type}
              onChange={v => setField("type", v)}
              options={["wizard.type.scoring","wizard.type.orienteering","wizard.type.mixed"].map(k => ({ value: t(k), label: t(k) }))}
            />
          </Field>
        </div>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <div className="space-y-3 font-mono">
          <div className="cm-label">{t("wizard.step2Title")}</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("wizard.teamCount")} error={errors.teamCount}>
              <input className={`cm-input ${errors.teamCount ? "cm-input-error" : ""}`}
                type="number" min="1" value={form.teamCount}
                onChange={e => setField("teamCount", e.target.value)} />
            </Field>
            <Field label={t("wizard.maxPlayers")} error={errors.maxPlayers}>
              <input className={`cm-input ${errors.maxPlayers ? "cm-input-error" : ""}`}
                type="number" min="1" value={form.maxPlayers}
                onChange={e => setField("maxPlayers", e.target.value)} />
            </Field>
          </div>
          {/* Teams list */}
          {teams.length > 0 && (
            <div className="cm-box p-2 space-y-1">
              {teams.map(team => (
                <div key={team.id} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300"
                    style={{ background: team.color }} />
                  <span className="flex-1 text-gray-700">{team.name}</span>
                  <button className="text-gray-400 hover:text-red-500 text-[10px]"
                    onClick={() => setTeams(prev => prev.filter(t => t.id !== team.id))}>×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input className="cm-input" placeholder="Název nového týmu..."
              value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTeam()} />
            <button className="cm-btn flex items-center gap-1 text-xs flex-shrink-0" onClick={addTeam}>
              <Plus size={12} /> {t("wizard.addTeam")}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div className="space-y-3 font-mono">
          <div className="cm-label">{t("wizard.step3Title")}</div>
          <div className="cm-box p-3 space-y-2 text-sm">
            {[
              [t("wizard.summaryName"),     form.name || "—"],
              [t("wizard.summaryDate"),     `${form.dateStart} – ${form.dateEnd}` || "—"],
              [t("wizard.summaryLocation"), form.location || "—"],
              [t("wizard.summaryTeams"),    `${teams.length || form.teamCount} týmů`],
              [t("wizard.summaryType"),     form.type],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between pb-1" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{k}</span>
                <span className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="cm-dashed p-2 text-xs text-center rounded-lg" style={{ color: "var(--text-muted)" }}>
            {t("wizard.confirmNote")}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button className="cm-btn" onClick={handleBack}>
          {step === 0 ? t("wizard.cancel") : t("wizard.back")}
        </button>
        <button className="cm-btn-primary" onClick={step < 2 ? handleNext : handleCreate}>
          {step < 2 ? t("wizard.continue") : t("wizard.create")}
        </button>
      </div>
    </ModalShell>
  );
}
