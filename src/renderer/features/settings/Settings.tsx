import type { AppSettings as AppSettingsType } from "../../env";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { YoutubeDownloaderSettings } from "./YoutubeDownloaderSettings";

enum SettingsTab {
    YoutubeDownloader = "YoutubeDownloader",
}

interface Props {
    settings: AppSettingsType;
    onSave: (settings: AppSettingsType) => void;
}

export function Settings({ settings, onSave }: Props) {
    async function handleYoutubeDownloaderSave(
        ytSettings: AppSettingsType["youtubeDownloaderSettings"],
    ) {
        const updated = { ...settings, youtubeDownloaderSettings: ytSettings };
        await window.electronAPI.saveSettings(updated);
        onSave(updated);
    }

    return (
        <Tabs
            defaultValue={SettingsTab.YoutubeDownloader}
            className="flex flex-col h-full bg-background text-foreground"
        >
            <TabsList className="shrink-0 w-full justify-start rounded-none border-b border-border h-auto p-0">
                <TabsTrigger
                    value={SettingsTab.YoutubeDownloader}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                >
                    YouTube Downloader settings
                </TabsTrigger>
            </TabsList>
            <TabsContent
                value={SettingsTab.YoutubeDownloader}
                className="flex-1 overflow-hidden mt-0"
            >
                <YoutubeDownloaderSettings
                    settings={settings.youtubeDownloaderSettings}
                    onSave={handleYoutubeDownloaderSave}
                />
            </TabsContent>
        </Tabs>
    );
}
