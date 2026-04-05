import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YoutubeDownloader } from "@/features/youtubeDownloader/YoutubeDownloader";
import { Settings } from "@/features/settings/Settings";
import type { AppSettings as AppSettingsType } from "./env.d";

enum AppTab {
    YoutubeDownloader = "YoutubeDownloader",
    Settings = "Settings",
}

export function App() {
    const [settings, setSettings] = useState<AppSettingsType | null>(null);

    useEffect(() => {
        window.electronAPI.getSettings().then(setSettings);
    }, []);

    if (!settings) return null;

    return (
        <Tabs
            defaultValue={AppTab.YoutubeDownloader}
            className="flex flex-col h-screen bg-background text-foreground"
        >
            <TabsList className="shrink-0 w-full justify-start rounded-none border-b border-border h-auto p-0">
                <TabsTrigger
                    value={AppTab.YoutubeDownloader}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                >
                    YouTube Downloader
                </TabsTrigger>
                <TabsTrigger
                    value={AppTab.Settings}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                >
                    Settings
                </TabsTrigger>
            </TabsList>
            <TabsContent value={AppTab.YoutubeDownloader} className="flex-1 overflow-hidden mt-0">
                <YoutubeDownloader settings={settings} />
            </TabsContent>
            <TabsContent value={AppTab.Settings} className="flex-1 overflow-auto mt-0">
                <Settings settings={settings} onSave={setSettings} />
            </TabsContent>
        </Tabs>
    );
}
