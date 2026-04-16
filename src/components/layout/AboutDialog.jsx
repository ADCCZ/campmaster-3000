import { Tent } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useTheme } from "../../context/ThemeContext";
import ModalShell from "../common/ModalShell";

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}:</span>
      <span className="font-bold" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

export default function AboutDialog({ onClose }) {
  const { t }    = useI18n();
  const { dark } = useTheme();
  return (
    <ModalShell title={t("about.title")} onClose={onClose} width="max-w-md">
      <div className="space-y-4">
        <div className="cm-dashed p-4 text-center rounded-lg">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
            style={{ background: "var(--green)" }}
          >
            <Tent size={22} color={dark ? "#0a0f0a" : "#fff"} />
          </div>
          <div className="font-mono font-bold text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>
            CampMaster 3000
          </div>
          <div className="cm-label mt-1">{t("about.version")}</div>
        </div>
        <div className="pl-3 space-y-1" style={{ borderLeft: "3px solid var(--green)" }}>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>{t("about.desc1")}</div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>{t("about.desc2")}</div>
        </div>
        <div className="cm-box p-3 space-y-2 rounded-lg">
          <Row label={t("about.author")}      value={t("about.authorValue")} />
          <Row label={t("about.personalNum")} value={t("about.personalNumValue")} />
          <Row label={t("about.course")}      value={t("about.courseValue")} />
          <Row label={t("about.year")}        value={t("about.yearValue")} />
        </div>
        <button className="cm-btn-primary w-full" onClick={onClose}>
          {t("about.close")}
        </button>
      </div>
    </ModalShell>
  );
}
