import type {BaseResponse} from "./base-response.ts";

export type FileItem = {
    id: string,
    minioPath: string,
    name: string
};

export interface UploadRequestData {
    name: string;
    encryptedFileKey: string;
    fileIv: string;
    mimeType?: string;
    size?: number;
}

export interface UploadRequestDetails {
    fileId: string;
    uploadUrl: string;
}

export type UploadRequestResponse = BaseResponse<UploadRequestDetails>;


