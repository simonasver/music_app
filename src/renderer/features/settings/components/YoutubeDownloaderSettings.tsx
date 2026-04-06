import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppSettings } from "../../../env";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ConfirmButton";
import { useToast } from "@/lib/toast";
import { Separator } from "@radix-ui/react-separator";
import { Label } from "@radix-ui/react-label";
import { Textarea } from "@/components/ui/textarea";

type YoutubeDownloaderSettingsType = AppSettings["youtubeDownloaderSettings"];

interface Props {
    settings: YoutubeDownloaderSettingsType;
    onSave: (settings: YoutubeDownloaderSettingsType) => void;
}

export function YoutubeDownloaderSettings({ settings, onSave }: Props) {
    const { t } = useTranslation();
    const toast = useToast();
    const [mp3Config, setMp3Config] = useState(settings.mp3Config);
    const [mp4Config, setMp4Config] = useState(settings.mp4Config);

    async function handleSelectFolder() {
        const folder = await window.electronAPI.selectFolder();
        if (folder) {
            onSave({ ...settings, downloadFileLocation: folder });
        }
    }

    async function handleMp3Save() {
        if (mp3Config === settings.mp3Config) {
            return;
        }

        onSave({ ...settings, mp3Config });
        toast.show(t("settings.ytdl.mp3ConfigSaved"));
    }

    async function handleMp4Save() {
        if (mp4Config === settings.mp4Config) {
            return;
        }

        onSave({ ...settings, mp4Config });
        toast.show(t("settings.ytdl.mp4ConfigSaved"));
    }

    async function handleReset() {
        const defaults = await window.electronAPI.getDefaultSettings();
        const defaultYtSettings = defaults.youtubeDownloaderSettings;
        setMp3Config(defaultYtSettings.mp3Config);
        setMp4Config(defaultYtSettings.mp4Config);
        onSave(defaultYtSettings);
        toast.show(t("settings.ytdl.settingsReset"));
    }

    return (
        <div className="h-full overflow-auto p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("settings.ytdl.downloadLocation")}
                </h2>
                <div className="flex items-center gap-3">
                    <Input
                        readOnly
                        value={settings.downloadFileLocation}
                        className="flex-1 bg-muted/30 cursor-default"
                    />
                    <Button variant="outline" onClick={handleSelectFolder}>
                        {t("settings.ytdl.change")}
                    </Button>
                </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("settings.ytdl.mp3Flags")}
                </h2>
                <Label htmlFor="mp3-flags" className="text-xs text-muted-foreground">
                    {t("settings.ytdl.mp3FlagsDesc")}
                </Label>
                <Textarea
                    id="mp3-flags"
                    rows={4}
                    className="font-mono text-sm resize-none"
                    value={mp3Config}
                    onChange={(e) => setMp3Config(e.target.value)}
                />
                <div>
                    <Button disabled={mp3Config === settings.mp3Config} onClick={handleMp3Save}>
                        {t("common.save")}
                    </Button>
                </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("settings.ytdl.mp4Flags")}
                </h2>
                <Label htmlFor="mp4-flags" className="text-xs text-muted-foreground">
                    {t("settings.ytdl.mp4FlagsDesc")}
                </Label>
                <Textarea
                    id="mp4-flags"
                    rows={4}
                    className="font-mono text-sm resize-none"
                    value={mp4Config}
                    onChange={(e) => setMp4Config(e.target.value)}
                />
                <div>
                    <Button disabled={mp4Config === settings.mp4Config} onClick={handleMp4Save}>
                        {t("common.save")}
                    </Button>
                </div>
            </div>

            <Separator />

            <div>
                <ConfirmButton
                    variant="outline"
                    confirmText={t("settings.ytdl.resetConfirm")}
                    confirmLabel={t("settings.ytdl.reset")}
                    onConfirm={handleReset}
                >
                    {t("settings.ytdl.resetToDefaults")}
                </ConfirmButton>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("settings.ytdl.history")}
                </h2>
                <div>
                    <ConfirmButton
                        variant="destructive"
                        confirmText={t("settings.ytdl.deleteHistoryConfirm")}
                        confirmLabel={t("settings.ytdl.delete")}
                        onConfirm={async () => {
                            await window.electronAPI.deleteAllHistory();
                            toast.show(t("settings.ytdl.historyDeleted"));
                        }}
                    >
                        {t("settings.ytdl.deleteAllHistory")}
                    </ConfirmButton>
                </div>
            </div>
        </div>
    );
}
