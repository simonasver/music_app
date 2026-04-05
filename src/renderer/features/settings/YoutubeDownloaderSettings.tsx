import { useState } from "react";
import type { AppSettings as AppSettingsType } from "../../env";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import { Label } from "@radix-ui/react-label";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_MP3_CONFIG =
    "-f bestaudio -x --audio-format mp3 --audio-quality 0 --no-mtime --no-playlist --no-overwrites";
const DEFAULT_MP4_CONFIG = "-f bestvideo+bestaudio --no-mtime --no-playlist --no-overwrites";

interface Props {
    settings: AppSettingsType;
    onSave: (settings: AppSettingsType) => void;
}

export function YoutubeDownloaderSettings({ settings, onSave }: Props) {
    const [mp3Config, setMp3Config] = useState(settings.youtubeDownloaderSettings.mp3Config);
    const [mp4Config, setMp4Config] = useState(settings.youtubeDownloaderSettings.mp4Config);

    async function handleSelectFolder() {
        const folder = await window.electronAPI.selectFolder();
        if (folder) {
            const updated = {
                ...settings,
                youtubeDownloaderSettings: {
                    ...settings.youtubeDownloaderSettings,
                    downloadFileLocation: folder,
                },
            };
            await window.electronAPI.saveSettings(updated);
            onSave(updated);
        }
    }

    async function handleMp3Blur() {
        if (mp3Config === settings.youtubeDownloaderSettings.mp3Config) return;
        const updated = {
            ...settings,
            youtubeDownloaderSettings: {
                ...settings.youtubeDownloaderSettings,
                mp3Config,
            },
        };
        await window.electronAPI.saveSettings(updated);
        onSave(updated);
    }

    async function handleMp4Blur() {
        if (mp4Config === settings.youtubeDownloaderSettings.mp4Config) return;
        const updated = {
            ...settings,
            youtubeDownloaderSettings: {
                ...settings.youtubeDownloaderSettings,
                mp4Config,
            },
        };
        await window.electronAPI.saveSettings(updated);
        onSave(updated);
    }

    async function handleReset() {
        const updated = {
            ...settings,
            youtubeDownloaderSettings: {
                ...settings.youtubeDownloaderSettings,
                mp3Config: DEFAULT_MP3_CONFIG,
                mp4Config: DEFAULT_MP4_CONFIG,
            },
        };
        setMp3Config(DEFAULT_MP3_CONFIG);
        setMp4Config(DEFAULT_MP4_CONFIG);
        await window.electronAPI.saveSettings(updated);
        onSave(updated);
    }

    return (
        <div className="p-6 flex flex-col gap-6 max-w-2xl">
            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Download Location
                </h2>
                <div className="flex items-center gap-3">
                    <Input
                        readOnly
                        value={settings.youtubeDownloaderSettings.downloadFileLocation}
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
