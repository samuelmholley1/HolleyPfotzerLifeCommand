import { Q } from '@nozbe/watermelondb';
import { database } from './db/index';
import { supabase } from './supabase';
import { Event } from './db/Event';
import { logger } from './logging';
import { apiService } from '../services/apiService';

export async function syncEvents() {
  const timer = logger.startTimer('syncEvents');
  logger.info('SYNC', 'Starting event sync');
  
  try {
    const eventsCollection = database.collections.get<Event>('events');
    const unsyncedEvents = await eventsCollection.query(Q.where('is_synced', false)).fetch();

    if (unsyncedEvents.length === 0) {
      logger.info('SYNC', 'No events to sync');
      timer();
      return;
    }

    logger.syncOperation('start', unsyncedEvents.length);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('SYNC', 'User not authenticated, cannot sync');
      logger.authFailure('Sync attempted without authentication');
      timer();
      return;
    }

    // Prepare the payload to EXACTLY match the TimescaleDB schema
    const eventsToSync = unsyncedEvents.map((event: Event) => ({
      // This is the key: ensure every key here is an exact column name in your Supabase table
      event_id: event.eventUUID,
      user_id: user.id,
      event_type: event.eventType,
      timestamp: new Date(event.timestamp).toISOString(),
      event_data: event.encryptedPayload, // Changed from encrypted_payload to event_data
      source: 'web', // Add the required source field
    }));

    logger.debug('SYNC', 'Prepared events for sync', { 
      eventCount: eventsToSync.length,
      eventTypes: eventsToSync.map(e => e.event_type)
    });

    // const { error } = await supabase.from('events').insert(eventsToSync);
    const { error } = await apiService.syncEvents(eventsToSync);

    if (error) {
      logger.error('SYNC', 'Failed to sync events to Supabase', { 
        error: error.message,
        eventCount: eventsToSync.length 
      }, new Error(error.message));
      logger.syncOperation('failed', unsyncedEvents.length, error.message);
      timer();
      throw error;
    }

    logger.info('SYNC', 'Successfully synced events to Supabase', { 
      eventCount: eventsToSync.length 
    });

    // Batch update local events to mark them as synced
    const syncedUpdates = unsyncedEvents.map(event =>
      event.prepareUpdate(rec => {
        rec.isSynced = true;
      })
    );

    await database.write(async () => {
      await database.batch(...syncedUpdates);
    });

    logger.syncOperation('completed', unsyncedEvents.length);
    logger.info('SYNC', 'Local events marked as synced');
    timer();

  } catch (err) {
    timer();
    logger.error('SYNC', 'Event sync failed', { 
      error: (err as Error).message 
    }, err as Error);
    logger.syncOperation('error', undefined, (err as Error).message);
  }
}
