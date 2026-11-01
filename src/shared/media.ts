export const MEDIA_TYPES: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    m4a: "audio/mp4",
    aac: "audio/aac",
    opus: "audio/ogg",
    wma: "audio/x-ms-wma",
    mp4: "video/mp4",
    m4v: "video/mp4",
    webm: "video/webm",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
};

export const MEDIA_EXTENSIONS = Object.keys(MEDIA_TYPES);

export const AUDIO_EXTENSIONS = MEDIA_EXTENSIONS.filter((ext) =>
    MEDIA_TYPES[ext].startsWith("audio/"),
);

export function fileExtension(name: string): string {
    const dot = name.lastIndexOf(".");
    return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function isMediaFileName(name: string): boolean {
    return fileExtension(name) in MEDIA_TYPES;
}

export function mediaMimeType(name: string): string {
    return MEDIA_TYPES[fileExtension(name)] ?? "application/octet-stream";
}

export const MEDIA_SCHEME = "media";

export function mediaUrl(filePath: string): string {
    return `${MEDIA_SCHEME}://local/${encodeURIComponent(filePath)}`;
}

export function mediaPathFromUrl(url: string): string {
    return decodeURIComponent(new URL(url).pathname.slice(1));
}
