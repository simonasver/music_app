import type { AppSettings as AppSettingsType } from "../../../env";
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
            <TabsList className="shrink-0 w-full rounded-none border-b border-border h-auto p-1 gap-1 bg-muted/40">
                <TabsTrigger
                    value={SettingsTab.YoutubeDownloader}
                    className="flex-1 rounded text-xs font-medium px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground"
                >
                    YouTube Downloader
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
