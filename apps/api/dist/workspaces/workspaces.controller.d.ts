import type { AuthUser } from '../auth/auth-user';
import { CreateWorkspaceDto } from './create-workspace.dto';
import { WorkspacesService } from './workspaces.service';
export declare class WorkspacesController {
    private readonly workspaces;
    constructor(workspaces: WorkspacesService);
    list(user: AuthUser): Promise<any[]>;
    create(user: AuthUser, dto: CreateWorkspaceDto): Promise<any>;
}
