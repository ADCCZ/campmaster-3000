import { useState, useRef } from "react";
import { Plus, Loader, MapPin, X } from "lucide-react";
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
    name: "", dateStart: "", dateEnd: "", location: "", type: "Víkendovka",
    lat: null, lng: null,
    teamCount: "4", maxPlayers: "8",
  });
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");

  // Geocoding state
  const [geoSuggestions, setGeoSuggestions] = useState([]);
  const [geoLoading,     setGeoLoading]     = useState(false);
  const geoTimer = useRef(null);

  function onLocationChange(val) {
    setForm(f => ({ ...f, location: val, lat: null, lng: null }));
    setErrors(prev => ({ ...prev, location: null }));
    clearTimeout(geoTimer.current);
    if (val.trim().length < 3) { setGeoSuggestions([]); return; }
    geoTimer.current = setTimeout(async () => {
      setGeoLoading(true);
      try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1&accept-language=cs,en`);
        const data = await res.json();
        setGeoSuggestions(data.map(r => ({
          short:   r.name || r.display_name.split(",")[0].trim(),
          full:    r.display_name,
          lat:     parseFloat(r.lat),
          lng:     parseFloat(r.lon),
        })));
      } catch { setGeoSuggestions([]); }
      finally  { setGeoLoading(false); }
    }, 420);
  }

  function pickGeo(s) {
    setForm(f => ({ ...f, location: s.short, lat: s.lat, lng: s.lng }));
    setGeoSuggestions([]);
  }

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: null }));
  }

  // ── Validate step 1 ──
  function validateStep1() {
    const e = {};
    e.name      = tError(t, validateRequired(form.name));
    e.dateStart = tError(t, validateRequired(form.dateStart));
    e.dateEnd   = tError(t, validateRequired(form.dateEnd));
    if (!e.dateStart && !e.dateEnd && form.dateStart && form.dateEnd && form.dateStart > form.dateEnd) {
      e.dateEnd = t("validation.dateEndBeforeStart");
    }
    e.location  = tError(t, validateRequired(form.location));
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
    const limit = Number(form.teamCount) || 0;
    if (limit > 0 && teams.length >= limit) {
      setErrors(prev => ({ ...prev, teamCount: t("validation.teamCountExceeded") }));
      return;
    }
    const colors = ["#ef4444","#3b82f6","#22c55e","#eab308","#8b5cf6","#f97316","#06b6d4","#ec4899"];
    setTeams(prev => [...prev, {
      id: `t${Date.now()}`,
      name,
      color: colors[prev.length % colors.length],
      members: 0, score: 0, max: 100, vedouci: "", category: "", status: "active", note: "",
    }]);
    setNewTeamName("");
  }

  const fmtDate = iso => { if (!iso) return ""; const [y,m,d] = iso.split("-"); return `${String(+d).padStart(2,"0")}.${String(+m).padStart(2,"0")}.${y}`; };

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
      dates: form.dateStart || form.dateEnd ? `${fmtDate(form.dateStart)} – ${fmtDate(form.dateEnd)}` : "",
      dateStart: form.dateStart || null,
      dateEnd: form.dateEnd || null,
      status: "upcoming",
      createdAt: new Date().toISOString(),
      location: form.location, type: form.type,
      mapCenter: form.lat && form.lng ? [form.lat, form.lng] : null,
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
              maxLength={80}
              value={form.name} onChange={e => setField("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("wizard.dateStart")} error={errors.dateStart}>
              <input className={`cm-input ${errors.dateStart ? "cm-input-error" : ""}`}
                type="date"
                value={form.dateStart} onChange={e => setField("dateStart", e.target.value)} />
            </Field>
            <Field label={t("wizard.dateEnd")} error={errors.dateEnd}>
              <input className={`cm-input ${errors.dateEnd ? "cm-input-error" : ""}`}
                type="date"
                value={form.dateEnd} onChange={e => setField("dateEnd", e.target.value)} />
            </Field>
          </div>
          <Field label={t("wizard.location")} error={errors.location}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <input className={`cm-input ${errors.location ? "cm-input-error" : ""}`}
                  placeholder={t("wizard.locationPlaceholder")}
                  maxLength={80}
                  value={form.location} onChange={e => onLocationChange(e.target.value)}
                  style={{ paddingRight: 36 }}
                  autoComplete="off"
                />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", color: form.lat ? "var(--green)" : "var(--text-dim)" }}>
                  {geoLoading ? <Loader size={14} className="animate-spin" /> : <MapPin size={14} />}
                </span>
              </div>
              {geoSuggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "var(--bg-card)", border: "1px solid var(--border-bright)",
                  borderRadius: 6, boxShadow: "0 8px 28px rgba(0,0,0,0.3)",
                  maxHeight: 200, overflowY: "auto", zIndex: 200,
                }}>
                  {geoSuggestions.map((s, i) => (
                    <div key={i}
                      className="px-3 py-2 cursor-pointer"
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      onClick={() => pickGeo(s)}
                    >
                      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{s.short}</div>
                      <div className="font-mono text-[10px] truncate" style={{ color: "var(--text-dim)" }}>{s.full}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <Field label={t("wizard.gameType")}>
            <CustomSelect
              className="w-full"
              value={form.type}
              onChange={v => setField("type", v)}
              options={["wizard.type.weekend","wizard.type.camp","wizard.type.national","wizard.type.oneday","wizard.type.troop"].map(k => ({ value: t(k), label: t(k) }))}
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
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: team.color, border: "1px solid var(--border-bright)" }} />
                  <span className="flex-1 font-mono" style={{ color: "var(--text-primary)" }}>{team.name}</span>
                  <button
                    className="flex items-center justify-center rounded transition-colors flex-shrink-0"
                    style={{ width: 26, height: 26, color: "var(--text-dim)" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
                    onClick={() => setTeams(prev => prev.filter(t => t.id !== team.id))}
                    title="Odebrat tým"
                  ><X size={16} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="cm-addteam-row">
            <input className="cm-input cm-addteam-input" placeholder="Název nového týmu..."
              maxLength={60}
              value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTeam()} />
            <button className="cm-btn cm-addteam-btn flex items-center gap-1 text-xs" onClick={addTeam}>
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
              [t("wizard.summaryDate"),     form.dateStart || form.dateEnd ? `${fmtDate(form.dateStart)} – ${fmtDate(form.dateEnd)}` : "—"],
              [t("wizard.summaryLocation"), form.location || "—"],
              [t("wizard.summaryTeams"),    `${teams.length || form.teamCount}`],
              [t("wizard.summaryType"),     form.type],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 pb-1" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{k}</span>
                <span className="font-bold text-xs text-right" style={{ color: "var(--text-primary)" }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="cm-dashed p-2 text-xs text-center rounded-lg" style={{ color: "var(--text-muted)" }}>
            {t("wizard.confirmNote")}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-6">
        <button className="cm-btn" style={{ height: 42, flex: "1 1 auto", whiteSpace: "nowrap" }} onClick={handleBack}>
          {step === 0 ? t("wizard.cancel") : t("wizard.back")}
        </button>
        <button className="cm-btn-primary" style={{ height: 42, flex: "1 1 auto", whiteSpace: "nowrap" }} onClick={step < 2 ? handleNext : handleCreate}>
          {step < 2 ? t("wizard.continue") : t("wizard.create")}
        </button>
      </div>
    </ModalShell>
  );
}
