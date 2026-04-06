import { useTranslation } from "react-i18next";
import i18n, { detectSystemLanguage } from "../../../i18n";
import type { AppSettings as AppSettingsType } from "../../../env.d";

interface Props {
    settings: AppSettingsType["general"];
    onSave: (general: AppSettingsType["general"]) => void;
}

export function GeneralSettings({ settings, onSave }: Props) {
    const { t } = useTranslation();

    function handleThemeChange(e: React.ChangeEvent<HTMLSelectElement>) {
        onSave({ ...settings, theme: e.target.value as "light" | "dark" | "system" });
    }

    function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const lang = e.target.value;
        const resolvedLang = lang === "system" ? detectSystemLanguage() : lang;
        i18n.changeLanguage(resolvedLang);
        onSave({ ...settings, language: lang });
    }

    return (
        <div className="h-full overflow-auto p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("settings.general.language")}
                </h2>
                <select
                    value={settings.language}
                    onChange={handleLanguageChange}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="system">{t("settings.general.languageSystem")}</option>
                    <option value="en">{t("settings.general.languageEn")}</option>
                    <option value="lt">{t("settings.general.languageLt")}</option>
                </select>
            </div>
            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("settings.general.theme")}
                </h2>
                <select
                    value={settings.theme ?? "system"}
                    onChange={handleThemeChange}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="system">{t("settings.general.themeSystem")}</option>
                    <option value="light">{t("settings.general.themeLight")}</option>
                    <option value="dark">{t("settings.general.themeDark")}</option>
                </select>
            </div>
        </div>
    );
}
