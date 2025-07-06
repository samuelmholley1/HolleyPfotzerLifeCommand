// lib/db/index.ts

import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';
import { Event } from './Event';
import { Task } from './Task';
import { Goal } from './Goal';
import { Project } from './Project';
import { Workspace } from './Workspace';
import { WorkspaceMember } from './WorkspaceMember';
import { Clarification } from './Clarification';
import { ClarificationResponse } from './ClarificationResponse';
import CommunicationMode from './models/CommunicationMode';

// LokiJS adapter configuration (works in both browser and React Native)
const adapter = new LokiJSAdapter({
  schema,
  // Use in-memory database for web, file for React Native
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  }
});

// Create the database instance
export const database = new Database({
  adapter,
  modelClasses: [Event, Task, Goal, Project, Workspace, WorkspaceMember, Clarification, ClarificationResponse, CommunicationMode],
});

// Export types for easy importing
export { Event } from './Event';
export { Task } from './Task';
export { Goal } from './Goal';
export { Project } from './Project';
export { Workspace } from './Workspace';
export { WorkspaceMember } from './WorkspaceMember';
export { Clarification } from './Clarification';
export { ClarificationResponse } from './ClarificationResponse';
export { default as CommunicationMode } from './models/CommunicationMode';
export type { EventDataType } from './types';

// For debugging purposes
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('WatermelonDB initialized successfully with LokiJS adapter');
}
