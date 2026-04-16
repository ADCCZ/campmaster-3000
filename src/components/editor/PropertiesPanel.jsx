import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useGame } from "../../context/GameContext";
import { getVedouciList } from "../../data/defaultData";
import CustomSelect from "../common/CustomSelect";
import {
  validateRequired, validateLat, validateLng, validatePositiveNumber,
  tError, firstError,
} from "../../utils/validation";

const NAME_MAX  = 50;
const DESC_MAX  = 400;
const PTS_MAX   = 5;   // max digits
const COORD_MAX = 12;  // "-180.123456" = 11 chars, +1 buffer

function Field({ label, error, children }) {
  return (
    <div className="cm-field">
      <label className="cm-field-label">{label}</label>
      {children}
      {error && <span className="cm-error">{error}</span>}
    </div>
  );
}

function CharCounter({ value, max }) {
  const len   = value.length;
  const near  = len >= max * 0.85;
  const over  = len >= max;
  return (
    <span
      className="text-[10px] font-mono ml-auto"
      style={{ color: over ? "#ef4444" : near ? "#f59e0b" : "var(--text-dim)" }}
    >
      {len}/{max}
    </span>
  );
}

// Allow only characters valid in a decimal coordinate: digits, dot, minus
function filterCoord(raw) {
  let v = raw.replace(/[^0-9.\-]/g, "");
  // keep at most one minus (only at start) and one dot
  const hasMinus = v.startsWith("-");
  v = (hasMinus ? "-" : "") + v.replace(/-/g, "").replace(/\./g, (m, i, s) =>
    s.indexOf(".") === i ? "." : ""   // keep first dot only
  );
  return v.slice(0, COORD_MAX);
}

export default function PropertiesPanel({ eventId, eventData, selectedPin, role }) {
  const { t }      = useI18n();
  const { updatePin, deletePin } = useGame();
  const isOrganizator = role === "Organizátor";

  const selPin  = (eventData.pins ?? []).find(p => p.id === selectedPin) ?? null;
  const canEdit = isOrganizator || selPin?.vedouci === role;

  const [form,   setForm]   = useState({ name: "", lat: "", lng: "", vedouci: "", description: "", maxPoints: "" });
  const [errors, setErrors] = useState({});
  const [saved,  setSaved]  = useState(false);

  const origFormRef   = useRef({});
  const prevSelPinRef = useRef(null);

  useEffect(() => {
    if (!selPin) return;
    const isNewPin = prevSelPinRef.current !== selectedPin;
    prevSelPinRef.current = selectedPin;

    if (isNewPin) {
      const initial = {
        name:        selPin.name        ?? "",
        lat:         selPin.lat         != null ? String(selPin.lat) : "",
        lng:         selPin.lng         != null ? String(selPin.lng) : "",
        vedouci:     selPin.vedouci     ?? "",
        description: selPin.description ?? "",
        maxPoints:   selPin.maxPoints   != null ? String(selPin.maxPoints) : "",
      };
      origFormRef.current = initial;
      setForm(initial);
      setErrors({});
      setSaved(false);
    } else {
      // re-sync only GPS when pin was dragged on the map
      setForm(prev => ({
        ...prev,
        lat: selPin.lat != null ? String(selPin.lat) : prev.lat,
        lng: selPin.lng != null ? String(selPin.lng) : prev.lng,
      }));
    }
  }, [selectedPin, selPin?.lat, selPin?.lng]); // eslint-disable-line

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: null }));
    setSaved(false);
  }

  function validate() {
    const e = {
      name:      tError(t, firstError(validateRequired(form.name))),
      lat:       tError(t, validateLat(form.lat)),
      lng:       tError(t, validateLng(form.lng)),
      maxPoints: tError(t, validatePositiveNumber(form.maxPoints)),
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  }

  function handleSave() {
    if (!validate()) return;
    updatePin(eventId, selPin.id, {
      name:        form.name.trim(),
      lat:         form.lat !== "" ? parseFloat(form.lat) : null,
      lng:         form.lng !== "" ? parseFloat(form.lng) : null,
      vedouci:     form.vedouci,
      description: form.description,
      maxPoints:   parseInt(form.maxPoints, 10) || 0,
    });
    origFormRef.current = { ...form, name: form.name.trim() };
    setSaved(true);
  }

  function handleCoordBlur() {
    if (!canEdit) return;
    const latErr = validateLat(form.lat);
    const lngErr = validateLng(form.lng);
    if (!latErr && !lngErr && form.lat !== "" && form.lng !== "") {
      updatePin(eventId, selPin.id, {
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
      });
    }
  }

  function handleCancel() {
    const orig = origFormRef.current;
    setForm(orig);
    setErrors({});
    setSaved(false);
    // revert map pin position if coords changed
    const lat = orig.lat !== "" ? parseFloat(orig.lat) : null;
    const lng = orig.lng !== "" ? parseFloat(orig.lng) : null;
    if (lat != null && lng != null) {
      updatePin(eventId, selPin.id, { lat, lng });
    }
  }

  function handleDelete() {
    if (window.confirm(`Opravdu smazat stanoviště "${selPin.name}"?`)) {
      deletePin(eventId, selPin.id);
    }
  }

  const leaders = getVedouciList(eventData);
  const orig = origFormRef.current;
  const formChanged = canEdit && Object.keys(orig).some(k => form[k] !== orig[k]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)" }}>
      <div className="border-b-2 border-gray-300 px-3 py-2 flex-shrink-0">
        <span className="cm-label" style={{ fontSize: 15 }}>{t("props.title")}</span>
      </div>

      {selPin === null ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center font-mono text-xs text-gray-400">
            <MapPin size={22} className="mx-auto mb-2 opacity-30" />
            {t("props.clickPrompt")}
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 p-3 font-mono space-y-3">
          {/* Badge */}
          <div
            className="flex items-center gap-3 pb-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{
                background:  canEdit ? "var(--green)" : "var(--text-dim)",
                color:       "var(--bg-base)",
                boxShadow:   canEdit ? "0 0 10px var(--green-glow)" : "none",
              }}
            >
              {selPin.label}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {t("props.day")} {selPin.day + 1} &nbsp;/&nbsp; {t("props.stage")} {selPin.stage + 1}
              </div>
              {!canEdit && (
                <div
                  className="text-[10px] font-mono mt-0.5 inline-block px-1.5 py-0.5 rounded"
                  style={{ border: "1px solid var(--border)", color: "var(--text-dim)" }}
                >
                  {t("props.readOnly")}
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="cm-field">
            <div className="flex items-center gap-1">
              <label className="cm-field-label flex-1">{t("props.stationName")}</label>
              <CharCounter value={form.name} max={NAME_MAX} />
            </div>
            <input
              className={`cm-input ${errors.name ? "cm-input-error" : ""} ${!canEdit ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
              value={form.name}
              maxLength={NAME_MAX}
              onChange={e => setField("name", e.target.value)}
              readOnly={!canEdit}
            />
            {errors.name && <span className="cm-error">{errors.name}</span>}
          </div>

          {/* GPS */}
          <div>
            <span className="cm-label block mb-2">{t("props.gps")}</span>
            <div className="grid grid-cols-2 gap-1">
              <Field label={t("props.gpsLat")} error={errors.lat}>
                <input
                  className={`cm-input ${errors.lat ? "cm-input-error" : ""} ${!canEdit ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                  value={form.lat}
                  onChange={e => setField("lat", filterCoord(e.target.value))}
                  onBlur={handleCoordBlur}
                  placeholder="49.748200"
                  readOnly={!canEdit}
                  inputMode="decimal"
                />
              </Field>
              <Field label={t("props.gpsLng")} error={errors.lng}>
                <input
                  className={`cm-input ${errors.lng ? "cm-input-error" : ""} ${!canEdit ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                  value={form.lng}
                  onChange={e => setField("lng", filterCoord(e.target.value))}
                  onBlur={handleCoordBlur}
                  placeholder="13.377600"
                  readOnly={!canEdit}
                  inputMode="decimal"
                />
              </Field>
            </div>
          </div>

          {/* Leader */}
          {isOrganizator && (
            <Field label={t("props.leader")}>
              <CustomSelect
                className="w-full"
                value={form.vedouci}
                onChange={v => setField("vedouci", v)}
                placeholder={t("props.leaderSelect")}
                options={leaders.filter(l => l !== "Organizátor").map(l => ({ value: l, label: l }))}
              />
            </Field>
          )}
          {!isOrganizator && selPin.vedouci && (
            <div>
              <span className="cm-field-label block mb-0.5">{t("props.leader")}</span>
              <div className="font-mono text-sm text-gray-700 px-2 py-1.5 border-2 border-gray-200 bg-gray-50">{selPin.vedouci}</div>
            </div>
          )}

          {/* Description */}
          <div className="cm-field">
            <div className="flex items-center gap-1 mb-0.5">
              <label className="cm-field-label flex-1">{t("props.description")}</label>
              <CharCounter value={form.description} max={DESC_MAX} />
            </div>
            <textarea
              className={`cm-input resize-none ${!canEdit ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
              style={{ height: "auto", padding: "10px 13px" }}
              rows={4}
              maxLength={DESC_MAX}
              placeholder={t("props.descriptionPlaceholder")}
              value={form.description}
              onChange={e => setField("description", e.target.value)}
              readOnly={!canEdit}
            />
          </div>

          {/* Max points */}
          <Field label={t("props.maxPoints")} error={errors.maxPoints}>
            <input
              className={`cm-input ${errors.maxPoints ? "cm-input-error" : ""} ${!canEdit ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
              inputMode="numeric"
              value={form.maxPoints}
              maxLength={PTS_MAX}
              onChange={e => setField("maxPoints", e.target.value.replace(/[^0-9]/g, ""))}
              readOnly={!canEdit}
            />
          </Field>

          {canEdit && (
            <button
              className={`cm-btn-primary w-full ${saved ? "border-green-700 bg-green-700" : ""}`}
              onClick={handleSave}
            >
              {saved ? "✓ Uloženo" : t("props.save")}
            </button>
          )}

          {formChanged && (
            <button className="cm-btn-danger w-full" onClick={handleCancel}>
              {t("props.cancelChanges")}
            </button>
          )}

          {isOrganizator && (
            <button className="cm-btn-danger w-full" onClick={handleDelete}>
              {t("props.delete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
