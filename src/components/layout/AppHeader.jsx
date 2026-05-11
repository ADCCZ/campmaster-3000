import { useState } from "react";
import { Moon, Sun, Info, Plus, ChevronLeft, Tent, Pencil, Check, X } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useTheme } from "../../context/ThemeContext";
import { useGame } from "../../context/GameContext";
import { getVedouciList } from "../../data/defaultData";
import CustomSelect from "../common/CustomSelect";

const H  = 40; // desktop
const Hm = 32; // compact mobile

export default function AppHeader({
  view,
  setView,
  activeDay,      setActiveDay,
  activeStage,    setActiveStage,
  activeEventId,  setActiveEventId,
  role,           setRole,
  eventData,
  onGoHome,
  onNewGame,
  onAbout,
}) {
  const { t, lang, setLang } = useI18n();
  const { dark, toggle }     = useTheme();
  const { updateEvent }      = useGame();

  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState("");

  function startRename(e) {
    e.stopPropagation();
    setNameInput(eventData?.name ?? "");
    setEditingName(true);
  }

  function commitRename() {
    const trimmed = nameInput.trim();
    if (trimmed && eventData?.id && trimmed !== eventData.name) {
      updateEvent(eventData.id, { name: trimmed });
    }
    setEditingName(false);
  }

  const isHome = view === "home";

  const days = eventData
    ? [
        { value: -1, label: t("nav.allDays") },
        ...eventData.tree.map((d, i) => ({ value: i, label: d.label })),
      ]
    : [{ value: -1, label: t("nav.allDays") }];

  const iconBtnStyle = { width: H, height: H };

  // Single language button — shows the TARGET language (click to switch)
  const langButton = (
    <button
      className="font-mono font-bold text-xs flex-shrink-0 transition-colors"
      style={{ width: H, height: H, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", borderRadius: 10 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.color = "var(--green)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
      onClick={() => setLang(lang === "cs" ? "en" : "cs")}
      title={lang === "cs" ? "Switch to English" : "Přepnout do češtiny"}
    >
      {lang === "cs" ? "EN" : "CS"}
    </button>
  );

  const makeModeToggle = (h) => !isHome && setView && (
    <div className="flex rounded-lg overflow-hidden flex-shrink-0"
      style={{ height: h, border: "1px solid var(--border-bright)" }}>
      {[["editor", t("nav.mode.edit")], ["live", t("nav.mode.live")]].map(([m, label]) => (
        <button key={m}
          className="px-3 font-semibold font-mono transition-colors whitespace-nowrap text-sm"
          style={{
            height: h,
            background: view === m ? "var(--green)" : "transparent",
            color: view === m ? (dark ? "#0a0f0a" : "#fff") : "var(--text-muted)",
          }}
          onClick={() => setView(m)}>
          {label}
        </button>
      ))}
    </div>
  );
  const modeToggle    = makeModeToggle(H);
  const modeToggleMob = makeModeToggle(Hm);

  const daySelectOpts = !isHome && view === "editor" && setActiveDay ? days : null;
  const stageSelectOpts = !isHome && view === "editor" && setActiveStage ? [
    { value: -1, label: t("nav.allStages") },
    ...(eventData?.tree?.[activeDay]?.stages ?? []).map((s, i) => ({ value: i, label: s.label })),
  ] : null;
  const roleSelectOpts = !isHome && eventData && setRole ? getVedouciList(eventData).map(v => ({
    value: v,
    label: v === "Organizátor" ? `👤 ${t("nav.role.organizer")}` : `🧑‍🏫 ${v}`,
  })) : null;

  const daySelect = daySelectOpts && (
    <CustomSelect className="flex-shrink-0" height={H}
      value={activeDay ?? -1} onChange={v => setActiveDay(Number(v))} options={daySelectOpts} />
  );
  const stageSelect = stageSelectOpts && (
    <CustomSelect className="flex-shrink-0" height={H}
      value={activeStage ?? -1} disabled={activeDay < 0}
      onChange={v => setActiveStage(Number(v))} options={stageSelectOpts} />
  );
  const roleSelect = roleSelectOpts && (
    <CustomSelect className="flex-shrink-0" height={H} value={role}
      onChange={v => setRole(v)} options={roleSelectOpts} />
  );

  const daySelectMob = daySelectOpts && (
    <CustomSelect className="flex-shrink-0" height={Hm}
      value={activeDay ?? -1} onChange={v => setActiveDay(Number(v))} options={daySelectOpts} />
  );
  const stageSelectMob = stageSelectOpts && (
    <CustomSelect className="flex-shrink-0" height={Hm}
      value={activeStage ?? -1} disabled={activeDay < 0}
      onChange={v => setActiveStage(Number(v))} options={stageSelectOpts} />
  );
  const roleSelectMob = roleSelectOpts && (
    <CustomSelect className="flex-shrink-0" height={Hm} value={role}
      onChange={v => setRole(v)} options={roleSelectOpts} />
  );

  const themeBtn = (size) => (
    <button className="cm-icon-btn flex-shrink-0" style={iconBtnStyle}
      onClick={toggle} title="Přepnout motiv"
      {...(dark ? { style: { ...iconBtnStyle, borderColor: "var(--border-bright)", color: "var(--green)" } } : {})}>
      {dark ? <Moon size={size} /> : <Sun size={size} />}
    </button>
  );

  const aboutBtn = (size) => (
    <button className="cm-icon-btn flex-shrink-0" style={iconBtnStyle}
      onClick={onAbout} title={t("nav.about")}>
      <Info size={size} />
    </button>
  );

  // ── COMPACT layout (< lg): fixed rows ───────────────────────────────────
  const mS = { width: Hm, height: Hm }; // small icon btn size

  const iconButtons = (
    <>
      <button
        className="font-mono font-bold text-xs flex-shrink-0 transition-colors"
        style={{ ...mS, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", borderRadius: 8 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.color = "var(--green)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        onClick={() => setLang(lang === "cs" ? "en" : "cs")}
        title={lang === "cs" ? "Switch to English" : "Přepnout do češtiny"}
      >{lang === "cs" ? "EN" : "CS"}</button>
      <button className="cm-icon-btn flex-shrink-0" style={{ ...mS, ...(dark ? { borderColor: "var(--border-bright)", color: "var(--green)" } : {}) }}
        onClick={toggle} title="Přepnout motiv">
        {dark ? <Moon size={14} /> : <Sun size={14} />}
      </button>
      <button className="cm-icon-btn flex-shrink-0" style={mS}
        onClick={onAbout} title={t("nav.about")}>
        <Info size={14} />
      </button>
    </>
  );

  const compactLayout = (
    <div className="flex flex-col w-full lg:hidden gap-1 py-1">

      {/* HOME — Row 1: logo + [Nová akce inline ≥440px] + icon buttons */}
      {isHome && (
        <div className="flex items-center gap-1.5">
          <div className="cm-logo flex-1 min-w-0" style={{ fontSize: 12 }}>
            <div className="cm-logo-icon flex-shrink-0" style={{ width: 28, height: 28, borderRadius: 6, paddingLeft: 1, paddingRight: 4 }}>
              <Tent size={14} color={dark ? "#0a0f0a" : "#fff"} />
            </div>
            <span className="cm-logo-name" style={{ overflowWrap: "break-word", wordBreak: "break-word", minWidth: 0 }}>
              CampMaster 3000
            </span>
          </div>
          <button className="cm-btn-primary cm-new-inline flex-shrink-0" style={{ height: Hm }} onClick={onNewGame}>
            <Plus size={14} />{t("nav.newGame")}
          </button>
          {iconButtons}
        </div>
      )}

      {/* HOME — Row 2: Nová akce full-width (below 440px only) */}
      {isHome && (
        <button className="cm-btn-primary cm-new-row w-full" style={{ height: Hm }} onClick={onNewGame}>
          <Plus size={14} />{t("nav.newGame")}
        </button>
      )}

      {/* EDITOR — Row 1: back + name | icon buttons (hidden ≤350px) */}
      {!isHome && (
        <div className="flex items-center gap-1.5">
          <button className="cm-icon-btn flex-shrink-0" style={mS}
            onClick={onGoHome} title="Zpět na seznam her">
            <ChevronLeft size={16} />
          </button>
          <div className="cm-logo overflow-hidden" style={{ fontSize: 12, flex: 1, minWidth: 0 }}>
            <div className="cm-logo-icon flex-shrink-0" style={{ width: 28, height: 28, borderRadius: 6, paddingLeft: 1, paddingRight: 4 }}>
              <Tent size={14} color={dark ? "#0a0f0a" : "#fff"} />
            </div>
            {editingName ? (
              <>
                <input
                  className="cm-input"
                  style={{ fontSize: 12, height: 24, padding: "0 6px", flex: 1, minWidth: 0 }}
                  value={nameInput}
                  autoFocus
                  maxLength={80}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingName(false); }}
                />
                <button onMouseDown={e => e.preventDefault()} onClick={commitRename} title="Uložit"
                  style={{ color: "var(--green)", padding: 2, display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <Check size={12} />
                </button>
                <button onMouseDown={e => e.preventDefault()} onClick={() => setEditingName(false)} title="Zrušit"
                  style={{ color: "#ef4444", padding: 2, display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, display: "block" }}>
                  {eventData?.name ?? "CampMaster 3000"}
                </span>
                <button
                  className="flex-shrink-0 ml-1"
                  style={{ color: "var(--text-dim)", padding: 1, display: "flex", alignItems: "center" }}
                  onClick={startRename}
                  title={t("home.rename")}
                >
                  <Pencil size={11} />
                </button>
              </>
            )}
          </div>
          <div className="cm-icons-inline items-center gap-1.5 flex-shrink-0">{iconButtons}</div>
        </div>
      )}

      {/* EDITOR — Row 1b (≤350px): icon buttons centered */}
      {!isHome && (
        <div className="cm-icons-row gap-1.5">{iconButtons}</div>
      )}

      {/* EDITOR — Row 2: Edit/Live toggle centered */}
      {!isHome && modeToggleMob && (
        <div className="flex justify-center">{modeToggleMob}</div>
      )}

      {/* EDITOR — Row 3: selectors */}
      {!isHome && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {daySelectMob}
          {stageSelectMob}
          {roleSelectMob}
        </div>
      )}
    </div>
  );

  // ── DESKTOP layout (>= lg): 3-column grid ────────────────────────────────
  const desktopLayout = (
    <div className="hidden lg:grid items-center w-full gap-2"
      style={{ gridTemplateColumns: "1fr auto 1fr" }}>

      {/* Left col: back + logo */}
      <div className="flex items-center gap-2 min-w-0">
        {!isHome && (
          <button className="cm-icon-btn flex-shrink-0" style={iconBtnStyle}
            onClick={onGoHome} title="Zpět na seznam her">
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="cm-logo min-w-0">
          <div className="cm-logo-icon flex-shrink-0" style={{ paddingLeft: 2, paddingRight: 6 }}>
            <Tent size={20} color={dark ? "#0a0f0a" : "#fff"} />
          </div>
          {isHome ? (
            <span className="truncate">CampMaster 3000</span>
          ) : editingName ? (
            <>
              <input
                className="cm-input text-sm font-mono"
                style={{ height: 28, padding: "0 8px", flex: 1, minWidth: 0 }}
                value={nameInput}
                autoFocus
                maxLength={80}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingName(false); }}
              />
              <button onMouseDown={e => e.preventDefault()} onClick={commitRename} title="Uložit"
                style={{ color: "var(--green)", padding: 3, display: "flex", alignItems: "center", flexShrink: 0 }}>
                <Check size={14} />
              </button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => setEditingName(false)} title="Zrušit"
                style={{ color: "#ef4444", padding: 3, display: "flex", alignItems: "center", flexShrink: 0 }}>
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <span className="truncate">{eventData?.name ?? "CampMaster 3000"}</span>
              <button
                className="flex-shrink-0 ml-1"
                style={{ color: "var(--text-dim)", padding: 2, display: "flex", alignItems: "center" }}
                onClick={startRename}
                title={t("home.rename")}
              >
                <Pencil size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Center col: Edit/Live toggle */}
      <div className="flex justify-center">
        {modeToggle}
      </div>

      {/* Right col: selectors + lang + theme + about */}
      <div className="flex items-center gap-1.5 justify-end min-w-0">
        {!isHome && view === "editor" && setActiveDay && (
          <CustomSelect className="hidden lg:flex flex-shrink-0" height={H}
            value={activeDay ?? -1} onChange={v => setActiveDay(Number(v))} options={days} />
        )}
        {!isHome && view === "editor" && setActiveStage && (
          <CustomSelect className="hidden xl:flex flex-shrink-0" height={H}
            value={activeStage ?? -1} disabled={activeDay < 0}
            onChange={v => setActiveStage(Number(v))}
            options={[
              { value: -1, label: t("nav.allStages") },
              ...(eventData?.tree?.[activeDay]?.stages ?? []).map((s, i) => ({ value: i, label: s.label })),
            ]} />
        )}
        {roleSelect}
        {isHome && (
          <button className="cm-btn-primary flex-shrink-0" style={{ height: H }} onClick={onNewGame}>
            <Plus size={16} />{t("nav.newGame")}
          </button>
        )}
        {langButton}
        {themeBtn(18)}
        {aboutBtn(18)}
      </div>
    </div>
  );

  return (
    <div className="cm-appbar">
      {compactLayout}
      {desktopLayout}
    </div>
  );
}
