import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YoutubeDownloader } from "@/features/youtubeDownloader/components/YoutubeDownloader";
import { Settings } from "@/features/settings/components/Settings";
import { Trimmer } from "@/features/trimmer/components/Trimmer";
import { Merger } from "@/features/merger/components/Merger";
import { ToastProvider } from "@/lib/toast";
import type { AppSettings as AppSettingsType } from "./env.d";
import i18n, { detectSystemLanguage } from "./i18n";

let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme: string) {
    if (systemThemeListener) {
        systemThemeQuery.removeEventListener("change", systemThemeListener);
        systemThemeListener = null;
    }
    if (theme === "dark") {
        document.documentElement.classList.add("dark");
    } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
    } else {
        document.documentElement.classList.toggle("dark", systemThemeQuery.matches);
        systemThemeListener = (e) => document.documentElement.classList.toggle("dark", e.matches);
        systemThemeQuery.addEventListener("change", systemThemeListener);
    }
}

enum AppTab {
    YoutubeDownloader = "YoutubeDownloader",
    Trim = "Trim",
    Merge = "Merge",
    Settings = "Settings",
}

export function App() {
    const [settings, setSettings] = useState<AppSettingsType | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        window.electronAPI.getSettings().then((s) => {
            const savedLang = s.general?.language ?? "system";
            const resolvedLang = savedLang === "system" ? detectSystemLanguage() : savedLang;
            if (resolvedLang !== i18n.language) {
                i18n.changeLanguage(resolvedLang);
            }
            setSettings(s);
        });
    }, []);

    useEffect(() => {
        if (!settings) return;
        applyTheme(settings.general.theme ?? "system");
    }, [settings, settings?.general.theme]);

    if (!settings) return null;

    return (
        <ToastProvider>
            <Tabs
                defaultValue={AppTab.YoutubeDownloader}
                className="flex flex-col h-screen bg-background text-foreground"
            >
                <TabsList className="shrink-0 w-full justify-start rounded-none border-b border-border h-auto p-0">
                    <TabsTrigger
                        value={AppTab.YoutubeDownloader}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                    >
                        {t("tabs.youtubeDownloader")}
                    </TabsTrigger>
                    <TabsTrigger
                        value={AppTab.Trim}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                    >
                        {t("tabs.trim")}
                    </TabsTrigger>
                    <TabsTrigger
                        value={AppTab.Merge}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                    >
                        {t("tabs.merge")}
                    </TabsTrigger>
                    <TabsTrigger
                        value={AppTab.Settings}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                    >
                        {t("tabs.settings")}
                    </TabsTrigger>
                </TabsList>
                <TabsContent
                    value={AppTab.YoutubeDownloader}
                    className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden"
                    forceMount
                >
                    <YoutubeDownloader settings={settings} />
                </TabsContent>
                <TabsContent
                    value={AppTab.Trim}
                    className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden"
                    forceMount
                >
                    <Trimmer />
                </TabsContent>
                <TabsContent
                    value={AppTab.Merge}
                    className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden"
                    forceMount
                >
                    <Merger />
                </TabsContent>
                <TabsContent
                    value={AppTab.Settings}
                    className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden"
                    forceMount
                >
                    <Settings settings={settings} onSave={setSettings} />
                </TabsContent>
            </Tabs>
        </ToastProvider>
    );
}
