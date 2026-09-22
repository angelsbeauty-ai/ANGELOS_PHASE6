import type { AuthUser } from '../auth/auth-user';
import { CreateMediaUploadDto } from './dto/create-media-upload.dto';
import { UpdateMediaAssetDto } from './dto/update-media-asset.dto';
import { MediaService } from './media.service';
export declare class MediaController {
    private readonly media;
    constructor(media: MediaService);
    list(user: AuthUser, workspaceId: string, clientId?: string, contentStatus?: string): Promise<any[]>;
    createUpload(user: AuthUser, workspaceId: string, dto: CreateMediaUploadDto): Promise<{
        asset: any;
        upload: {
            bucket: string;
            path: string;
            token: string;
        };
    }>;
    finalize(user: AuthUser, workspaceId: string, assetId: string): Promise<{
        asset: any;
        verified: boolean;
    }>;
    viewUrl(user: AuthUser, workspaceId: string, assetId: string): Promise<{
        url: string;
        expiresInSeconds: number;
    }>;
    exportUrl(user: AuthUser, workspaceId: string, assetId: string): Promise<{
        url: string;
        filename: any;
        expiresInSeconds: number;
    }>;
    update(user: AuthUser, workspaceId: string, assetId: string, dto: UpdateMediaAssetDto): Promise<any>;
}
