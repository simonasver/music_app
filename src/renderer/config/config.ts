export const MEDIA_EXTENSIONS = new Set([
    "mp3",
    "mp4",
    "wav",
    "ogg",
    "flac",
    "m4a",
    "aac",
    "opus",
    "wma",
    "webm",
    "mkv",
    "avi",
    "mov",
    "m4v",
]);

export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "bmp"]);

export function getMediaPath(files: FileList): string | null {
    const file = files[0];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    return MEDIA_EXTENSIONS.has(ext) ? window.electronAPI.getPathForFile(file) : null;
}
