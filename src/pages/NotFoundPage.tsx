import { useTranslation } from "react-i18next";
import { NotFound } from "@/components/feedback/NotFound";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <NotFound
      eyebrow={t("errors.notFoundEyebrow")}
      title={t("errors.notFound")}
      description={t("errors.notFoundDescription")}
      action={{ label: t("errors.backToOverview"), to: "/" }}
    />
  );
}
