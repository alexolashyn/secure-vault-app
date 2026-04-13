import apiClient from "./apiClient";
import type {UploadRequestData, UploadRequestResponse} from "../types/file.ts";
import axios from "axios";

export const filesApi = {
    uploadToStorage: async (uploadUrl: string, encryptedBlob: Blob): Promise<void> => {
        await axios.put(uploadUrl, encryptedBlob, {
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });
    },

    requestUpload: async (
        data: UploadRequestData
    ): Promise<UploadRequestResponse> => {
        const response = await apiClient.post(
            "/files/upload-request",
            data
        );

        return response.data;
    },

    requestDownload: async (fileId: string) => {
        const response = await apiClient.get(
            `/files/download-request/${fileId}`
        );
        return response.data;
    },

    getFiles: async () => {
        const response = await apiClient.get('/files');
        return response.data;
    }
};