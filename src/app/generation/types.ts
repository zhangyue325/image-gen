export type DraftPayload = {
    prompt?: string;
    purpose?: string;
    type?: "image" | "video";
    model?: string;
    ratio?: string;
    size?: string;
    templateId?: number;
  };

export type UploadItem = {
    id: string;
    file: File;
    name: string;
  };

export type ReferenceImagePayload = {
    name: string;
    mimeType: string;
    data: string;
  };
