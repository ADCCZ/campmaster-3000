import { Moon, Sun, Info, Plus, ChevronLeft, Tent } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useTheme } from "../../context/ThemeContext";
import { getVedouciList } from "../../data/defaultData";
import CustomSelect from "../common/CustomSelect";

const H = 40;

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

  const isHome = view === "home";

  const days = eventData
    ? [
        { value: -1, label: t("nav.allDays") },
        ...eventData.tree.map((d, i) => ({ value: i, label: d.label })),
      ]
    : [{ value: -1, label: t("nav.allDays") }];

  // ── Shared icon button style ──────────────────────────────────────────────
  const iconBtnStyle = { width: H, height: H };

  // ── Language toggle ───────────────────────────────────────────────────────
  const LangToggle = () => (
    <div className="flex rounded-md overflow-hidden flex-shrink-0"
      style={{ border: "1px solid var(--border)", height: H }}>
      {["cs", "en"].map(l => (
        <button key={l}
          className="px-2.5 font-mono font-bold transition-colors text-xs"
          style={{
            height: H,
            background: lang === l ? "var(--green)" : "transparent",
            color: lang === l ? (dark ? "#0a0f0a" : "#fff") : "var(--text-muted)",
          }}
          onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  // ── Edit/Live toggle ──────────────────────────────────────────────────────
  const ModeToggle = () => (
    <div className="flex rounded-lg overflow-hidden flex-shrink-0"
      style={{ height: H, border: "1px solid var(--border-bright)" }}>
      {[["editor", t("nav.mode.edit")], ["live", t("nav.mode.live")]].map(([m, label]) => (
        <button key={m}
          className="px-4 font-semibold font-mono transition-colors whitespace-nowrap text-sm"
          style={{
            height: H,
            background: view === m ? "var(--green)" : "transparent",
            color: view === m ? (dark ? "#0a0f0a" : "#fff") : "var(--text-muted)",
          }}
          onClick={() => setView(m)}>
          {label}
        </button>
      ))}
    </div>
  );

  // ── MOBILE layout (< sm): 2 rows ─────────────────────────────────────────
  const MobileLayout = () => (
    <div className="flex flex-col gap-1.5 w-full sm:hidden py-1">
      {/* Row 1: back + full logo + theme + about */}
      <div className="flex items-center gap-2">
        {!isHome && (
          <button className="cm-icon-btn flex-shrink-0" style={iconBtnStyle}
            onClick={onGoHome} title="Zpět na seznam her">
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="cm-logo flex-1 min-w-0" style={{ fontSize: 15 }}>
          <div className="cm-logo-icon flex-shrink-0" style={{ width: 32, height: 32, borderRadius: 7 }}>
            <Tent size={17} color={dark ? "#0a0f0a" : "#fff"} />
          </div>
          <span className="truncate">
            {isHome ? "CampMaster 3000" : (eventData?.name ?? "CampMaster 3000")}
          </span>
        </div>
        <button className="cm-icon-btn flex-shrink-0" style={iconBtnStyle}
          onClick={toggle} title="Přepnout motiv"
          {...(dark ? { style: { ...iconBtnStyle, borderColor: "var(--border-bright)", color: "var(--green)" } } : {})}>
          {dark ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button className="cm-icon-btn flex-shrink-0" style={iconBtnStyle}
          onClick={onAbout} title={t("nav.about")}>
          <Info size={16} />
        </button>
      </div>

      {/* Row 2: mode toggle + role + lang + new game */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {!isHome && setView && <ModeToggle />}
        {!isHome && eventData && setRole && (
          <CustomSelect className="flex-shrink-0" height={H} value={role}
            onChange={v => setRole(v)}
            options={getVedouciList(eventData).map(v => ({
              value: v,
              label: v === "Organizátor" ? `👤 ${t("nav.role.organizer")}` : `🧑‍🏫 ${v}`,
            }))} />
        )}
        <LangToggle />
        {isHome && (
          <button className="cm-btn-primary flex-shrink-0" style={{ height: H }} onClick={onNewGame}>
            <Plus size={15} />{t("nav.newGame")}
          </button>
        )}
      </div>
    </div>
  );

  // ── DESKTOP layout (>= sm): 3-column grid — no overlap possible ─────────
  const DesktopLayout = () => (
    <div className="hidden sm:grid items-center w-full gap-2"
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
          <div className="cm-logo-icon flex-shrink-0">
            <Tent size={20} color={dark ? "#0a0f0a" : "#fff"} />
          </div>
          <span className="truncate">
            {isHome ? "CampMaster 3000" : (eventData?.name ?? "CampMaster 3000")}
          </span>
        </div>
      </div>

      {/* Center col: Edit/Live toggle (truly centered in grid) */}
      <div className="flex justify-center">
        {!isHome && setView && <ModeToggle />}
      </div>

      {/* Right col: controls */}
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
        {!isHome && eventData && setRole && (
          <CustomSelect className="flex-shrink-0" height={H} value={role}
            onChange={v => setRole(v)}
            options={getVedouciList(eventData).map(v => ({
              value: v,
              label: v === "Organizátor" ? `👤 ${t("nav.role.organizer")}` : `🧑‍🏫 ${v}`,
            }))} />
        )}
        <LangToggle />
        {isHome && (
          <button className="cm-btn-primary flex-shrink-0" style={{ height: H }} onClick={onNewGame}>
            <Plus size={16} />{t("nav.newGame")}
          </button>
        )}
        <button className="cm-icon-btn flex-shrink-0" style={iconBtnStyle}
          onClick={toggle} title="Přepnout motiv"
          {...(dark ? { style: { ...iconBtnStyle, borderColor: "var(--border-bright)", color: "var(--green)" } } : {})}>
          {dark ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="cm-icon-btn flex-shrink-0" style={iconBtnStyle}
          onClick={onAbout} title={t("nav.about")}>
          <Info size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="cm-appbar">
      <MobileLayout />
      <DesktopLayout />
    </div>
  );
}
