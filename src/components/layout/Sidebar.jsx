import { Map, Users, BarChart2 } from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export default function Sidebar({ active, setActive, eventData, role }) {
  const { t } = useI18n();
  const isOrganizator = role === "Organizátor";

  const tabs = [
    { id: "map",   icon: <Map size={14} />,      label: t("sidebar.map")   },
    { id: "teams", icon: <Users size={14} />,     label: t("sidebar.teams") },
    { id: "stats", icon: <BarChart2 size={14} />, label: t("sidebar.stats") },
  ];

  return (
    <div className="cm-sidebar">
      <div className="cm-sidebar-header flex items-center justify-between">
        <span>{t("sidebar.navigation")}</span>
        {!isOrganizator && (
          <span
            className="text-[9px] font-mono truncate max-w-20 px-1 py-0.5 rounded"
            style={{ border: "1px solid var(--border)", color: "var(--text-dim)" }}
          >
            {role}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tabs.map(tab => {
          const isReadonly = !isOrganizator && tab.id !== "map";
          const isActive   = active === tab.id;
          return (
            <button
              key={tab.id}
              className="cm-tree-item w-full text-left"
              style={isActive ? { color: "var(--green)", borderLeftColor: "var(--green)", background: "var(--green-glow)" } : {}}
              onClick={() => setActive(tab.id)}
            >
              {tab.icon}
              <span className="flex-1 text-[13px]">{tab.label}</span>
              {isReadonly && (
                <span
                  className="text-[8px] font-mono px-1 py-0.5 rounded flex-shrink-0"
                  style={{ border: "1px solid var(--border)", color: "var(--text-dim)" }}
                >
                  {t("sidebar.readOnly")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current event info */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="cm-dashed p-2 text-center rounded-lg">
          <div className="cm-label text-[9px] mb-1">{t("sidebar.currentEvent")}</div>
          <div className="font-semibold text-xs truncate" style={{ color: "var(--text-primary)" }}>
            {eventData?.icon} {eventData?.name}
          </div>
          <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>
            {eventData?.dates}
          </div>
        </div>
      </div>
    </div>
  );
}
