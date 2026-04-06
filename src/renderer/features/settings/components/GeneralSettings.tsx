import { useTranslation } from "react-i18next";
import i18n, { detectSystemLanguage } from "../../../i18n";
import type { AppSettings as AppSettingsType } from "../../../env.d";

interface Props {
    settings: AppSettingsType["general"];
    onSave: (general: AppSettingsType["general"]) => void;
}

export function GeneralSettings({ settings, onSave }: Props) {
    const { t } = useTranslation();

    function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const lang = e.target.value;
        const resolvedLang = lang === "system" ? detectSystemLanguage() : lang;
        i18n.changeLanguage(resolvedLang);
        onSave({ ...settings, language: lang });
    }

    return (
        <div className="p-4 space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">{t("settings.general.language")}</label>
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
        </div>
    );
}
