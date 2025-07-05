// services/clarificationService.ts

import { Clarification, ClarificationResponse } from '../lib/db';
import { Q } from '@nozbe/watermelondb';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../lib/logging';

export interface ClarificationRecord {
  id: string;
  workspace_id: string;
  proposer_id: string;
  topic: string;
  assumptions: string[]; // Array of assumption strings
  status: 'pending' | 'agreed' | 'needs_discussion' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ProposeConversationParams {
  topic: string;
  assumptions: string[];
  workspaceId: string;
  proposerId: string;
}

export interface SubmitResponseParams {
  clarification: Clarification;
  responses: Record<number, 'agree' | 'disagree' | 'needs_discussion'>;
  responderId: string;
}

export class ClarificationService {
  /**
   * Create a new clarification proposal in local database
   */
  static async proposeConversation(
    database: any,
    { topic, assumptions, workspaceId, proposerId }: ProposeConversationParams
  ): Promise<Clarification> {
    try {
      log.info('clarificationService', 'Creating clarification proposal', {
        topic,
        assumptionsCount: assumptions.length,
        workspaceId,
        proposerId
      });

      const clarificationUUID = uuidv4();
      const now = Date.now();

      // Create clarification in local database
      const clarification = await database.write(async () => {
        return await database.get('clarifications').create((clarification: any) => {
          clarification.workspaceId = workspaceId;
          clarification.proposerId = proposerId;
          clarification.topic = topic;
          clarification.assumptions = JSON.stringify(assumptions);
          clarification.status = 'pending';
          clarification.isSynced = false;
          clarification.clarificationUUID = clarificationUUID;
          clarification.createdAt = now;
          clarification.updatedAt = now;
        });
      });

      log.info('clarificationService', 'Clarification created successfully in local database', {
        id: clarification.id,
        uuid: clarificationUUID
      });

      // Attempt to sync to backend
      try {
        await this.syncClarificationToSupabase(database, clarification);
      } catch (syncError) {
        log.warn('clarificationService', 'Failed to sync clarification to backend, will retry later', {
          error: String(syncError),
          clarificationId: clarification.id
        });
        // Don't throw the sync error - local creation succeeded
      }

      return clarification;

    } catch (error) {
      log.error('clarificationService', 'Failed to create clarification', {
        error: String(error),
        topic,
        workspaceId,
        proposerId
      });
      throw error;
    }
  }

  /**
   * Get all clarifications for a workspace
   */
  static async getClarifications(database: any, workspaceId: string): Promise<Clarification[]> {
    try {
      const clarifications = await database.get('clarifications')
        .query(Q.where('workspace_id', workspaceId))
        .fetch();

      return clarifications;
    } catch (error) {
      log.error('clarificationService', 'Failed to fetch clarifications', {
        error: String(error),
        workspaceId
      });
      throw error;
    }
  }

  /**
   * Get pending clarifications for a workspace that were not proposed by the current user
   */
  static async getPendingClarifications(database: any, { workspaceId, userId }: { workspaceId: string; userId: string }): Promise<Clarification[]> {
    try {
      const clarifications = await database.get('clarifications')
        .query(
          Q.where('workspace_id', workspaceId),
          Q.where('status', 'pending'),
          Q.where('proposer_id', Q.notEq(userId))
        )
        .fetch();

      return clarifications;
    } catch (error) {
      log.error('clarificationService', 'Failed to fetch pending clarifications', {
        error: String(error),
        workspaceId,
        userId
      });
      throw error;
    }
  }

  /**
   * Submit responses to a clarification
   */
  static async submitResponse(
    database: any,
    { clarification, responses, responderId }: SubmitResponseParams
  ): Promise<void> {
    try {
      const now = Date.now();
      const responseUUIDs: string[] = [];

      log.info('clarificationService', 'Submitting clarification responses', {
        clarificationId: clarification.id,
        responderId,
        responseCount: Object.keys(responses).length
      });

      // Create response records in a transaction
      await database.write(async () => {
        // Create individual response records for each assumption
        for (const [assumptionIndex, responseStatus] of Object.entries(responses)) {
          const responseUUID = uuidv4();
          responseUUIDs.push(responseUUID);

          await database.get('clarification_responses').create((response: any) => {
            response.clarificationId = clarification.id;
            response.responderId = responderId;
            response.assumptionIndex = parseInt(assumptionIndex);
            response.responseStatus = responseStatus;
            response.isSynced = false;
            response.responseUUID = responseUUID;
            response.createdAt = now;
            response.updatedAt = now;
          });
        }

        // Check if all responses are 'agree' to determine new clarification status
        const allResponses = Object.values(responses);
        const allAgree = allResponses.every(response => response === 'agree');
        const newStatus = allAgree ? 'agreed' : 'needs_discussion';

        // Update the clarification status
        await clarification.update((record: any) => {
          record.status = newStatus;
          record.isSynced = false; // Mark for re-sync
          record.updatedAt = now;
        });

        log.info('clarificationService', 'Clarification status updated based on responses', {
          clarificationId: clarification.id,
          newStatus,
          allAgree
        });
      });

      log.info('clarificationService', 'Clarification responses submitted successfully', {
        clarificationId: clarification.id,
        responseUUIDs,
        responderId
      });

      // Attempt to sync to backend
      try {
        await this.syncResponsesToSupabase(database, clarification.id);
      } catch (syncError) {
        log.warn('clarificationService', 'Failed to sync responses to backend, will retry later', {
          error: String(syncError),
          clarificationId: clarification.id
        });
        // Don't throw the sync error - local creation succeeded
      }

    } catch (error) {
      log.error('clarificationService', 'Failed to submit clarification responses', {
        error: String(error),
        clarificationId: clarification.id,
        responderId
      });
      throw error;
    }
  }

  /**
   * Get all responses for a clarification
   */
  static async getClarificationResponses(database: any, clarificationId: string): Promise<ClarificationResponse[]> {
    try {
      const responses = await database.get('clarification_responses')
        .query(Q.where('clarification_id', clarificationId))
        .fetch();

      return responses;
    } catch (error) {
      log.error('clarificationService', 'Failed to fetch clarification responses', {
        error: String(error),
        clarificationId
      });
      throw error;
    }
  }

  /**
   * Update clarification status
   */
  static async updateClarificationStatus(
    database: any,
    clarificationId: string,
    status: 'agreed' | 'needs_discussion' | 'cancelled'
  ): Promise<void> {
    try {
      await database.write(async () => {
        const clarification = await database.get('clarifications').find(clarificationId);
        await clarification.update((record: any) => {
          record.status = status;
          record.isSynced = false; // Mark for re-sync
          record.updatedAt = Date.now();
        });
      });

      log.info('clarificationService', 'Clarification status updated', {
        clarificationId,
        status
      });

    } catch (error) {
      log.error('clarificationService', 'Failed to update clarification status', {
        error: String(error),
        clarificationId,
        status
      });
      throw error;
    }
  }

  /**
   * Sync clarification to Supabase backend
   */
  private static async syncClarificationToSupabase(database: any, clarification: Clarification): Promise<void> {
    try {
      const clarificationData = {
        id: clarification.clarificationUUID,
        workspace_id: clarification.workspaceId,
        proposer_id: clarification.proposerId,
        topic: clarification.topic,
        assumptions: clarification.assumptions, // JSON string
        status: clarification.status,
        created_at: new Date(clarification.createdAt).toISOString(),
        updated_at: new Date(clarification.updatedAt).toISOString(),
      };

      const { error } = await supabase
        .from('clarifications')
        .upsert(clarificationData);

      if (error) {
        throw new Error(`Supabase sync failed: ${error.message}`);
      }

      // Mark as synced in local database
      await database.write(async () => {
        await clarification.update((record: any) => {
          record.isSynced = true;
        });
      });

      log.info('clarificationService', 'Clarification synced to Supabase successfully', {
        uuid: clarification.clarificationUUID
      });

    } catch (error) {
      log.error('clarificationService', 'Failed to sync clarification to Supabase', {
        error: String(error),
        uuid: clarification.clarificationUUID
      });
      throw error;
    }
  }

  /**
   * Sync clarification responses to Supabase backend
   */
  private static async syncResponsesToSupabase(database: any, clarificationId: string): Promise<void> {
    try {
      // Get all unsynced responses for this clarification
      const unsyncedResponses = await database.get('clarification_responses')
        .query(
          Q.where('clarification_id', clarificationId),
          Q.where('is_synced', false)
        )
        .fetch();

      if (unsyncedResponses.length === 0) {
        return;
      }

      // Prepare response data for Supabase
      const responseData = unsyncedResponses.map((response: any) => ({
        id: response.responseUUID,
        clarification_id: response.clarificationId,
        responder_id: response.responderId,
        assumption_index: response.assumptionIndex,
        response_status: response.responseStatus,
        created_at: new Date(response.createdAt).toISOString(),
        updated_at: new Date(response.updatedAt).toISOString(),
      }));

      // Sync responses to Supabase
      const { error: responsesError } = await supabase
        .from('clarification_responses')
        .upsert(responseData);

      if (responsesError) {
        throw new Error(`Supabase responses sync failed: ${responsesError.message}`);
      }

      // Also sync the updated clarification
      const clarification = await database.get('clarifications').find(clarificationId);
      await this.syncClarificationToSupabase(database, clarification);

      // Mark responses as synced
      await database.write(async () => {
        for (const response of unsyncedResponses) {
          await response.update((record: any) => {
            record.isSynced = true;
          });
        }
      });

      log.info('clarificationService', 'Clarification responses synced to Supabase successfully', {
        clarificationId,
        responseCount: unsyncedResponses.length
      });

    } catch (error) {
      log.error('clarificationService', 'Failed to sync clarification responses to Supabase', {
        error: String(error),
        clarificationId
      });
      throw error;
    }
  }

  /**
   * Sync all unsynced clarifications and responses to backend
   */
  static async syncPendingClarifications(database: any): Promise<void> {
    try {
      // Sync unsynced clarifications
      const unsyncedClarifications = await database.get('clarifications')
        .query(Q.where('is_synced', false))
        .fetch();

      log.info('clarificationService', `Found ${unsyncedClarifications.length} unsynced clarifications`);

      for (const clarification of unsyncedClarifications) {
        try {
          await this.syncClarificationToSupabase(database, clarification);
        } catch (error) {
          log.error('clarificationService', 'Failed to sync individual clarification', {
            error: String(error),
            clarificationId: clarification.id
          });
          // Continue with other clarifications
        }
      }

      // Sync unsynced responses
      const unsyncedResponses = await database.get('clarification_responses')
        .query(Q.where('is_synced', false))
        .fetch();

      log.info('clarificationService', `Found ${unsyncedResponses.length} unsynced responses`);

      // Group responses by clarification_id for efficient syncing
      const responsesByClarity: Record<string, any[]> = {};
      for (const response of unsyncedResponses) {
        const clarificationId = response.clarificationId;
        if (!responsesByClarity[clarificationId]) {
          responsesByClarity[clarificationId] = [];
        }
        responsesByClarity[clarificationId].push(response);
      }

      // Sync responses grouped by clarification
      for (const [clarificationId, responses] of Object.entries(responsesByClarity)) {
        try {
          await this.syncResponsesToSupabase(database, clarificationId);
        } catch (error) {
          log.error('clarificationService', 'Failed to sync responses for clarification', {
            error: String(error),
            clarificationId,
            responseCount: responses.length
          });
          // Continue with other responses
        }
      }

    } catch (error) {
      log.error('clarificationService', 'Failed to sync pending clarifications and responses', {
        error: String(error)
      });
      throw error;
    }
  }
}

export const clarificationService = ClarificationService;

/*
Usage Examples:

// Get pending clarifications for review
const pendingClarifications = await clarificationService.getPendingClarifications(database, {
  workspaceId: 'workspace-123',
  userId: 'user-456'
});

// Submit responses to a clarification
await clarificationService.submitResponse(database, {
  clarification: clarificationInstance,
  responses: {
    0: 'agree',           // First assumption: agree
    1: 'needs_discussion', // Second assumption: needs discussion
    2: 'disagree'         // Third assumption: disagree
  },
  responderId: 'user-456'
});

// Get all responses for a clarification
const responses = await clarificationService.getClarificationResponses(database, clarificationId);
*/