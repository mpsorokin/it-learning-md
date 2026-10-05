import { useTranslation } from "react-i18next";
import { StatusScreen } from "@/components/feedback/StatusScreen";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <StatusScreen
      eyebrow={t("errors.notFoundEyebrow")}
      title={t("errors.notFound")}
      description={t("errors.notFoundDescription")}
      action={{ label: t("errors.backToOverview"), to: "/" }}
    />
  );
}
