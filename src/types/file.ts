import type {BaseResponse} from "./base-response.ts";

export type FileItem = {
    id: string,
    minioPath: string,
    name: string,
    status: FILE_STATUS,
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

export type FILE_STATUS = "pending" | "success" | "failed";


