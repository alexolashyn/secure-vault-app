import apiClient from "./apiClient";
import type { UploadRequestData, UploadRequestResponse, FileItem } from "../types/file.ts";
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
        return response.data.details;
    },

    getOwnersFiles: async (): Promise<FileItem[]> => {
        const response = await apiClient.get('/files');
        return response.data.details;
    },

    getSharedFiles: async (): Promise<FileItem[]> => {
        const response = await apiClient.get('/files/shared');
        return response.data.details;
    },

    getUserPublicKey: async (userId: string) => {
        const response = await apiClient.get(`/users/${userId}/public-key`);
        return response.data.details;
    },

    shareFile: async (fileId: string, userId: string, encryptedFileKey: string) => {
        const response = await apiClient.post(`/files/share/${fileId}`, {
            userId,
            encryptedFileKey,
        });
        return response.data;
    },

    searchUsers: async (query: string) => {
        const response = await apiClient.get(`/users/search/${query}`);
        return response.data.details;
    },
};