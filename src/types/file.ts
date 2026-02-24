export interface FileDoc {
    _id: string;
    originalName: string;
    storageName: string;
    mimeType: string;
    size: number;
    url?: string | null;   // server side path or URL
    uploader?: string | null;
    createdAt: string;
}