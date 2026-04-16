import { useI18n } from "../../context/I18nContext";
import ModalShell from "./ModalShell";

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  const { t } = useI18n();
  return (
    <ModalShell title={t("common.confirm")} onClose={onCancel} width="max-w-sm">
      <div className="space-y-4 font-mono">
        <p className="text-sm text-gray-700">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="cm-btn" onClick={onCancel}>{t("common.cancel")}</button>
          <button className="cm-btn-danger" onClick={onConfirm}>{t("common.delete")}</button>
        </div>
      </div>
    </ModalShell>
  );
}
