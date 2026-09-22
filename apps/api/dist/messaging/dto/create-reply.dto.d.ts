export declare class CreateReplyDto {
    body: string;
    sendNow?: boolean;
    routineCategory?: 'faq' | 'booking_confirmation' | 'appointment_reminder' | 'aftercare' | 'follow_up';
}
