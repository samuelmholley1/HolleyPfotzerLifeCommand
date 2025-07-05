// types/communication.ts

export interface CommunicationEvent {
  id: string;
  eventType: string;
  encryptedPayload: string;
  [key: string]: any;
}

// Add these placeholder types
export type DebugLoop = any;
export type CommunicationMode = any;
export type CapacityStatus = any;
export type CommunicationStateTransition = any;
export type StateChange = any;
export type EmergencyState = any;
