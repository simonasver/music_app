import { useState } from "react";
import type { AppSettings } from "../../env";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import { Label } from "@radix-ui/react-label";
import { Textarea } from "@/components/ui/textarea";

type YoutubeDownloaderSettingsType = AppSettings["youtubeDownloaderSettings"];

interface Props {
    settings: YoutubeDownloaderSettingsType;
    onSave: (settings: YoutubeDownloaderSettingsType) => void;
}

export function YoutubeDownloaderSettings({ settings, onSave }: Props) {
    const [mp3Config, setMp3Config] = useState(settings.mp3Config);
    const [mp4Config, setMp4Config] = useState(settings.mp4Config);

    async function handleSelectFolder() {
        const folder = await window.electronAPI.selectFolder();
        if (folder) {
            onSave({ ...settings, downloadFileLocation: folder });
        }
    }

    async function handleMp3Blur() {
        if (mp3Config === settings.mp3Config) return;
        onSave({ ...settings, mp3Config });
    }

    async function handleMp4Blur() {
        if (mp4Config === settings.mp4Config) return;
        onSave({ ...settings, mp4Config });
    }

    async function handleReset() {
        const defaults = await window.electronAPI.getDefaultSettings();
        const defaultYtSettings = defaults.youtubeDownloaderSettings;
        setMp3Config(defaultYtSettings.mp3Config);
        setMp4Config(defaultYtSettings.mp4Config);
        onSave(defaultYtSettings);
    }

    return (
        <div className="h-full overflow-auto p-6 flex flex-col gap-6 max-w-2xl">
            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Download Location
                </h2>
                <div className="flex items-center gap-3">
                    <Input
                        readOnly
                        value={settings.downloadFileLocation}
                        className="flex-1 bg-muted/30 cursor-default"
                    />
                    <Button variant="outline" onClick={handleSelectFolder}>
                        Change
                    </Button>
                </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    MP3 Download Flags
                </h2>
                <Label htmlFor="mp3-flags" className="text-xs text-muted-foreground">
                    Passed directly to yt-dlp for MP3 downloads
                </Label>
                <Textarea
                    id="mp3-flags"
                    rows={4}
                    className="font-mono text-sm resize-none"
                    value={mp3Config}
                    onChange={(e) => setMp3Config(e.target.value)}
                    onBlur={handleMp3Blur}
                />
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    MP4 Download Flags
                </h2>
                <Label htmlFor="mp4-flags" className="text-xs text-muted-foreground">
                    Passed directly to yt-dlp for MP4 downloads
                </Label>
                <Textarea
                    id="mp4-flags"
                    rows={4}
                    className="font-mono text-sm resize-none"
                    value={mp4Config}
                    onChange={(e) => setMp4Config(e.target.value)}
                    onBlur={handleMp4Blur}
                />
            </div>

            <Separator />

            <div>
                <Button variant="outline" onClick={handleReset}>
                    Reset to Defaults
                </Button>
            </div>
        </div>
    );
}
