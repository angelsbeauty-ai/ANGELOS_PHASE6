import type { AuthUser } from '../auth/auth-user';
import type { CreateClientDto } from './dto/create-client.dto';
import type { UpdateClientDto } from './dto/update-client.dto';
import type { CreateClientNoteDto } from './dto/create-note.dto';
import type { CreateTreatmentDto } from './dto/create-treatment.dto';
import type { CreateConsentDto } from './dto/create-consent.dto';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { AutomationsService } from '../automations/automations.service';
export declare class ClientsService {
    private readonly automations;
    constructor(automations: AutomationsService);
    list(user: AuthUser, workspaceId: string, search?: string): Promise<{
        id: any;
        display_name: any;
        first_name: any;
        last_name: any;
        email: any;
        phone: any;
        language: any;
        status: any;
        source: any;
        do_not_auto_message: any;
        created_at: any;
        updated_at: any;
    }[]>;
    create(user: AuthUser, workspaceId: string, dto: CreateClientDto): Promise<any>;
    get(user: AuthUser, workspaceId: string, clientId: string): Promise<{
        client: any;
        notes: any[];
        treatments: any[];
        consents: any[];
        payments: any[];
        followups: any[];
    }>;
    update(user: AuthUser, workspaceId: string, clientId: string, dto: UpdateClientDto): Promise<any>;
    addNote(user: AuthUser, workspaceId: string, clientId: string, dto: CreateClientNoteDto): Promise<any>;
    addTreatment(user: AuthUser, workspaceId: string, clientId: string, dto: CreateTreatmentDto): Promise<any>;
    addConsent(user: AuthUser, workspaceId: string, clientId: string, dto: CreateConsentDto): Promise<any>;
    addFollowup(user: AuthUser, workspaceId: string, clientId: string, dto: CreateFollowupDto): Promise<any>;
    private assertUniqueContact;
    private assertClient;
}
