import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import lt from "./locales/lt.json";

export function detectSystemLanguage(): string {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("lt")) return "lt";
    return "en";
}

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        lt: { translation: lt },
    },
    lng: detectSystemLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
});

export default i18n;
