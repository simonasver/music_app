import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YoutubeDownloader } from "@/features/youtubeDownloader/components/YoutubeDownloader";
import { Settings } from "@/features/settings/components/Settings";
import { ToastProvider } from "@/lib/toast";
import type { AppSettings as AppSettingsType } from "./env.d";
import i18n, { detectSystemLanguage } from "./i18n";

enum AppTab {
    YoutubeDownloader = "YoutubeDownloader",
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
                <TabsContent value={AppTab.Settings} className="flex-1 overflow-auto mt-0">
                    <Settings settings={settings} onSave={setSettings} />
                </TabsContent>
            </Tabs>
        </ToastProvider>
    );
}
