import { ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { logAudit } from '../../utils/logger.js';
import { FileErrorCodes } from '../../schemas/file.schema.js';
import axios from 'axios';
import path from 'path';
export class FilesService {
    /**
     * List files from a cloud provider for a specific project
     */
    async listFiles(projectId, query, userId) {
        try {
            // Get project details
            const project = await getDB().collection('projects').findOne({
                _id: new ObjectId(projectId),
                'members.userId': userId
            });
            if (!project) {
                throw new ApiError('Project not found or user not a member', 404, FileErrorCodes.PROJECT_NOT_FOUND);
            }
            // Get cloud integration details
            const cloudIntegration = await getDB().collection('cloudProviderIntegrations').findOne({
                _id: new ObjectId(project.cloudIntegrationId)
            });
            if (!cloudIntegration) {
                throw new ApiError('Cloud integration not found', 404, FileErrorCodes.CLOUD_INTEGRATION_NOT_FOUND);
            }
            // Get cloud provider details
            const cloudProvider = await getDB().collection('cloudProviders').findOne({
                _id: new ObjectId(cloudIntegration.cloudProviderId)
            });
            if (!cloudProvider) {
                throw new ApiError('Cloud provider not found', 404, FileErrorCodes.CLOUD_PROVIDER_ERROR);
            }
            // Check if token is valid
            if (!cloudIntegration.accessToken) {
                throw new ApiError('Cloud integration token not available', 401, FileErrorCodes.TOKEN_EXPIRED);
            }
            // Determine the folder path to list
            const baseFolderPath = project.folderpath;
            const requestedFolder = query.folder || '';
            const fullPath = path.join(baseFolderPath, requestedFolder).replace(/\\/g, '/');
            // Log the file listing request
            logAudit('files.list', userId, projectId, {
                path: fullPath,
                provider: cloudProvider.slug,
                recursive: query.recursive
            });
            // Call the appropriate cloud provider API based on the provider slug
            const files = await this.fetchFilesFromProvider(cloudProvider.slug, cloudIntegration.accessToken, fullPath, query);
            return files;
        }
        catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('Error listing files:', error);
            throw new ApiError('Failed to list files from cloud provider', 500, FileErrorCodes.CLOUD_PROVIDER_ERROR);
        }
    }
    /**
     * Fetch files from the appropriate cloud provider
     */
    async fetchFilesFromProvider(providerSlug, accessToken, folderPath, query) {
        switch (providerSlug) {
            case 'gdrive':
                return this.fetchFilesFromGDrive(accessToken, folderPath, query);
            case 'dropbox':
                return this.fetchFilesFromDropbox(accessToken, folderPath, query);
            case 'onedrive':
                return this.fetchFilesFromOneDrive(accessToken, folderPath, query);
            default:
                throw new ApiError(`Unsupported cloud provider: ${providerSlug}`, 400, FileErrorCodes.CLOUD_PROVIDER_ERROR);
        }
    }
    /**
     * Fetch files from Google Drive
     */
    async fetchFilesFromGDrive(accessToken, folderPath, query) {
        try {
            // First, find the folder ID for the given path
            const folderId = await this.findGDriveFolderId(accessToken, folderPath);
            if (!folderId) {
                throw new ApiError(`Folder not found: ${folderPath}`, 404, FileErrorCodes.INVALID_PATH);
            }
            // Construct query parameters for Google Drive API
            const queryParams = new URLSearchParams({
                q: `'${folderId}' in parents and trashed = false`,
                fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents)',
                pageSize: query.limit.toString()
            });
            // Make API request to Google Drive
            const response = await axios.get(`https://www.googleapis.com/drive/v3/files?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            // Transform Google Drive response to our File type
            return response.data.files.map((file) => ({
                fileId: file.id,
                name: file.name,
                mimeType: file.mimeType,
                path: folderPath + '/' + file.name,
                status: 'pending',
                size: parseInt(file.size || '0', 10),
                createdAt: file.createdTime,
                modifiedAt: file.modifiedTime,
                metadata: {
                    webViewLink: file.webViewLink,
                    isFolder: file.mimeType === 'application/vnd.google-apps.folder'
                }
            }));
        }
        catch (error) {
            console.error('Error fetching files from Google Drive:', error);
            throw new ApiError('Failed to fetch files from Google Drive', 500, FileErrorCodes.INTEGRATION_ERROR);
        }
    }
    /**
     * Find Google Drive folder ID for a given path
     */
    async findGDriveFolderId(accessToken, folderPath) {
        // This is a simplified implementation
        // In a real implementation, you would need to traverse the folder structure
        try {
            const pathParts = folderPath.split('/').filter(Boolean);
            let currentFolderId = 'root'; // Start with root folder
            for (const part of pathParts) {
                const queryParams = new URLSearchParams({
                    q: `name = '${part}' and '${currentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                    fields: 'files(id)'
                });
                const response = await axios.get(`https://www.googleapis.com/drive/v3/files?${queryParams}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                if (response.data.files.length === 0) {
                    return null;
                }
                currentFolderId = response.data.files[0].id;
            }
            return currentFolderId;
        }
        catch (error) {
            console.error('Error finding Google Drive folder ID:', error);
            return null;
        }
    }
    /**
     * Fetch files from Dropbox
     */
    async fetchFilesFromDropbox(accessToken, folderPath, query) {
        try {
            // Make API request to Dropbox
            const response = await axios.post('https://api.dropboxapi.com/2/files/list_folder', {
                path: folderPath === '/' ? '' : folderPath,
                recursive: query.recursive,
                limit: query.limit
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            // Transform Dropbox response to our File type
            return response.data.entries.map((entry) => ({
                fileId: entry.id,
                name: entry.name,
                mimeType: entry['.tag'] === 'folder' ? 'folder' : this.getMimeTypeFromPath(entry.path_display),
                path: entry.path_display,
                status: 'pending',
                size: entry.size || 0,
                modifiedAt: entry.server_modified,
                metadata: {
                    isFolder: entry['.tag'] === 'folder',
                    rev: entry.rev
                }
            }));
        }
        catch (error) {
            console.error('Error fetching files from Dropbox:', error);
            throw new ApiError('Failed to fetch files from Dropbox', 500, FileErrorCodes.INTEGRATION_ERROR);
        }
    }
    /**
     * Fetch files from OneDrive
     */
    async fetchFilesFromOneDrive(accessToken, folderPath, query) {
        try {
            // OneDrive API requires a different path format
            const encodedPath = encodeURIComponent(folderPath);
            // Make API request to OneDrive
            const response = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/root:${encodedPath}:/children`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    $top: query.limit
                }
            });
            // Transform OneDrive response to our File type
            return response.data.value.map((item) => ({
                fileId: item.id,
                name: item.name,
                mimeType: item.folder ? 'folder' : (item.file?.mimeType || this.getMimeTypeFromPath(item.name)),
                path: folderPath + '/' + item.name,
                status: 'pending',
                size: item.size || 0,
                createdAt: item.createdDateTime,
                modifiedAt: item.lastModifiedDateTime,
                metadata: {
                    isFolder: !!item.folder,
                    webUrl: item.webUrl
                }
            }));
        }
        catch (error) {
            console.error('Error fetching files from OneDrive:', error);
            throw new ApiError('Failed to fetch files from OneDrive', 500, FileErrorCodes.INTEGRATION_ERROR);
        }
    }
    /**
     * Get MIME type from file path
     */
    getMimeTypeFromPath(filePath) {
        const extension = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.zip': 'application/zip',
            '.mp3': 'audio/mpeg',
            '.mp4': 'video/mp4'
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }
}
