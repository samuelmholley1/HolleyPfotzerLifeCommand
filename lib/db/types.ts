// lib/db/types.ts

// This defines the structure of the raw data for an event.
export type EventDataType = {
    name: string;
    severity?: number;
    mood?: number;
    notes?: string;
    //... any other fields specific to an event type
};
