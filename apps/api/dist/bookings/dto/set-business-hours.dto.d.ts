declare class BusinessHourDto {
    dayOfWeek: number;
    startTime?: string;
    endTime?: string;
    isClosed: boolean;
}
export declare class SetBusinessHoursDto {
    hours: BusinessHourDto[];
}
export {};
