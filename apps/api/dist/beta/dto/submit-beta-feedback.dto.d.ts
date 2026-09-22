export declare class SubmitBetaFeedbackDto {
    category: 'bug' | 'friction' | 'idea' | 'success' | 'testimonial_candidate' | 'support';
    message: string;
    rating?: number;
    permissionToContact?: boolean;
    permissionToQuote?: boolean;
}
