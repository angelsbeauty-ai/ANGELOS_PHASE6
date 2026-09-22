import type { AuthUser } from '../auth/auth-user';
import type { CreateMediaUploadDto } from './dto/create-media-upload.dto';
import type { UpdateMediaAssetDto } from './dto/update-media-asset.dto';
export declare class MediaService {
    list(user: AuthUser, workspaceId: string, filters: {
        clientId?: string;
        contentStatus?: string;
    }): Promise<any[]>;
    createUpload(user: AuthUser, workspaceId: string, dto: CreateMediaUploadDto): Promise<{
        asset: any;
        upload: {
            bucket: string;
            path: string;
            token: string;
        };
    }>;
    finalizeUpload(user: AuthUser, workspaceId: string, assetId: string): Promise<{
        asset: any;
        verified: boolean;
    }>;
    createViewUrl(user: AuthUser, workspaceId: string, assetId: string): Promise<{
        url: string;
        expiresInSeconds: number;
    }>;
    createExportUrl(user: AuthUser, workspaceId: string, assetId: string): Promise<{
        url: string;
        filename: any;
        expiresInSeconds: number;
    }>;
    update(user: AuthUser, workspaceId: string, assetId: string, dto: UpdateMediaAssetDto): Promise<any>;
    private getAsset;
}
