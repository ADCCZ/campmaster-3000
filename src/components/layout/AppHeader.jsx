import { Moon, Sun, Info, Plus, ChevronLeft, Tent } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useTheme } from "../../context/ThemeContext";
import { getVedouciList } from "../../data/defaultData";
import CustomSelect from "../common/CustomSelect";

const H = 54; // uniform height for all interactive elements in AppBar

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

  return (
    <div className="cm-appbar" style={{ position: "relative" }}>

      {/* ── LEFT ── */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {!isHome && (
          <button className="cm-icon-btn flex-shrink-0" onClick={onGoHome} title="Zpět na seznam her">
            <ChevronLeft size={24} />
          </button>
        )}

        <div className="cm-logo min-w-0">
          <div className="cm-logo-icon flex-shrink-0">
            <Tent size={22} color={dark ? "#0a0f0a" : "#fff"} />
          </div>
          <span className="truncate">
            {isHome ? "CampMaster 3000" : (eventData?.name ?? "CampMaster 3000")}
          </span>
        </div>

      </div>

      {/* ── CENTER — Edit/Live toggle (absolutely centred) ── */}
      {!isHome && setView && (
        <div
          className="flex rounded-lg overflow-hidden flex-shrink-0"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            height: H,
            border: "1px solid var(--border-bright)",
          }}
        >
          {[["editor", t("nav.mode.edit")], ["live", t("nav.mode.live")]].map(([m, label]) => (
            <button
              key={m}
              className="px-7 font-semibold font-mono transition-colors whitespace-nowrap"
              style={{
                height: H,
                fontSize: 15,
                background: view === m ? "var(--green)" : "transparent",
                color: view === m ? (dark ? "#0a0f0a" : "#fff") : "var(--text-muted)",
              }}
              onClick={() => setView(m)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── RIGHT ── */}
      <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">

        {/* Day selector */}
        {!isHome && view === "editor" && setActiveDay && (
          <CustomSelect
            className="flex-shrink-0"
            height={H}
            value={activeDay ?? -1}
            onChange={v => setActiveDay(Number(v))}
            options={days}
          />
        )}

        {/* Stage selector */}
        {!isHome && view === "editor" && setActiveStage && (
          <CustomSelect
            className="flex-shrink-0"
            height={H}
            value={activeStage ?? -1}
            disabled={activeDay < 0}
            onChange={v => setActiveStage(Number(v))}
            options={[
              { value: -1, label: t("nav.allStages") },
              ...(eventData?.tree?.[activeDay]?.stages ?? []).map((s, i) => ({ value: i, label: s.label })),
            ]}
          />
        )}

        {/* Role selector */}
        {!isHome && eventData && setRole && (
          <CustomSelect
            className="flex-shrink-0"
            height={H}
            value={role}
            onChange={v => setRole(v)}
            options={getVedouciList(eventData).map(v => ({
              value: v,
              label: v === "Organizátor" ? `👤 ${t("nav.role.organizer")}` : `🧑‍🏫 ${v}`,
            }))}
          />
        )}

        {/* Language toggle */}
        <div
          className="flex rounded-md overflow-hidden flex-shrink-0"
          style={{ border: "1px solid var(--border)", height: H }}
        >
          {["cs", "en"].map(l => (
            <button
              key={l}
              className="px-3 font-mono font-bold transition-colors"
              style={{
                height: H,
                fontSize: 14,
                background: lang === l ? "var(--green)" : "transparent",
                color: lang === l ? (dark ? "#0a0f0a" : "#fff") : "var(--text-muted)",
              }}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* New game button (home only) */}
        {isHome && (
          <button
            className="cm-btn-primary flex-shrink-0"
            style={{ height: H }}
            onClick={onNewGame}
          >
            <Plus size={18} />
            {t("nav.newGame")}
          </button>
        )}

        {/* Dark/light toggle */}
        <button
          className="cm-icon-btn flex-shrink-0"
          onClick={toggle}
          title={dark ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
          style={dark ? { borderColor: "var(--border-bright)", color: "var(--green)" } : {}}
        >
          {dark ? <Moon size={22} /> : <Sun size={22} />}
        </button>

        {/* About */}
        <button className="cm-icon-btn flex-shrink-0" onClick={onAbout} title={t("nav.about")}>
          <Info size={22} />
        </button>
      </div>
    </div>
  );
}
