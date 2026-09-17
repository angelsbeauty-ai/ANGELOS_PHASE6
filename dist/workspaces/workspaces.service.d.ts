import type { AuthUser } from '../auth/auth-user';
import type { CreateWorkspaceDto } from './create-workspace.dto';
import { BetaService } from '../beta/beta.service';
export declare class WorkspacesService {
    private readonly beta;
    constructor(beta: BetaService);
    create(user: AuthUser, dto: CreateWorkspaceDto): Promise<any>;
    list(user: AuthUser): Promise<any[]>;
}
