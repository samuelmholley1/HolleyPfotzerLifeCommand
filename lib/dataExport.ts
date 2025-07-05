// lib/dataExport.ts

/**
 * DATA EXPORT AND BACKUP FUNCTIONALITY
 * Provides secure data export for user backup and GDPR compliance
 */

import { database } from './db/index';
import { cryptoManager } from './crypto.secure';
import { logger } from './logging';
import { Q } from '@nozbe/watermelondb';
import { Event } from './db/Event'; // Correct import path for Event model
import { Task } from './db/Task'; // Correct import for Task model
import { Workspace } from './db/Workspace'; // Import Workspace model

export interface ExportOptions {
  includeEvents?: boolean;
  includeTasks?: boolean;
  includeWorkspaces?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  format?: 'json' | 'csv';
  encrypted?: boolean;
}

export interface ExportResult {
  data: any;
  metadata: {
    exportedAt: string;
    userId: string;
    recordCount: number;
    format: string;
    encrypted: boolean;
  };
}

class DataExportService {
  private static instance: DataExportService;

  static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService();
    }
    return DataExportService.instance;
  }

  /**
   * Export user data with optional filtering and encryption
   */
  async exportUserData(userId: string, options: ExportOptions = {}): Promise<ExportResult> {
    const timer = logger.startTimer('DataExport:exportUserData');
    logger.info('EXPORT', 'Starting data export', { userId, options });

    try {
      const {
        includeEvents = true,
        includeTasks = true,
        includeWorkspaces = true,
        dateRange,
        format = 'json',
        encrypted = true
      } = options;

      const exportData: any = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        userId,
      };

      let totalRecords = 0;

      // Export Events
      if (includeEvents) {
        const eventsCollection = database.collections.get('events');
        let eventsQuery = eventsCollection.query();

        if (dateRange) {
          eventsQuery = eventsCollection.query(
            Q.where('timestamp', Q.gte(dateRange.start.getTime())),
            Q.where('timestamp', Q.lte(dateRange.end.getTime()))
          );
        }

        const events = await eventsQuery.fetch();
        
        // Decrypt events for export
        const decryptedEvents = [];
        for (const event of events as import('./db/Event').Event[]) { // Explicit type cast for build safety
          try {
            const decryptedData = await cryptoManager.decryptEvent(event.encryptedPayload);
            decryptedEvents.push({
              id: event.id,
              eventType: event.eventType,
              timestamp: new Date(event.timestamp).toISOString(),
              data: decryptedData,
              createdAt: event.createdAt.toISOString(),
              workspaceId: event.workspaceId
            });
          } catch (error) {
            logger.warn('EXPORT', 'Failed to decrypt event for export', { 
              eventId: event.id, 
              error: (error as Error).message 
            });
          }
        }

        exportData.events = decryptedEvents;
        totalRecords += decryptedEvents.length;
        logger.info('EXPORT', 'Exported events', { count: decryptedEvents.length });
      }

      // Export Tasks
      if (includeTasks) {
        const tasksCollection = database.collections.get('tasks');
        let tasksQuery = tasksCollection.query();

        if (dateRange) {
          tasksQuery = tasksCollection.query(
            Q.where('created_at', Q.gte(dateRange.start.getTime())),
            Q.where('created_at', Q.lte(dateRange.end.getTime()))
          );
        }

        const tasks = await tasksQuery.fetch();
        // Type cast to Task[] for property access
        const exportedTasks = (tasks as Task[]).map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          category: task.category,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
          estimatedDuration: task.estimatedDuration,
          actualDuration: task.actualDuration,
          tags: task.tagsArray,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          workspaceId: task.workspaceId,
          parentTaskId: task.parentTaskId
        }));

        exportData.tasks = exportedTasks;
        totalRecords += exportedTasks.length;
        logger.info('EXPORT', 'Exported tasks', { count: exportedTasks.length });
      }

      // Export Workspaces
      if (includeWorkspaces) {
        const workspacesCollection = database.collections.get('workspaces');
        const workspaces = await workspacesCollection.query().fetch();
        
        // Type cast to Workspace[] for property access
        const exportedWorkspaces = (workspaces as Workspace[]).map(workspace => ({
          id: workspace.id,
          name: workspace.name,
          type: workspace.type,
          ownerId: workspace.ownerId,
          createdAt: workspace.createdAt.toISOString(),
          updatedAt: workspace.updatedAt.toISOString()
        }));

        exportData.workspaces = exportedWorkspaces;
        totalRecords += exportedWorkspaces.length;
        logger.info('EXPORT', 'Exported workspaces', { count: exportedWorkspaces.length });
      }

      // Format conversion
      let finalData;
      if (format === 'csv') {
        finalData = this.convertToCSV(exportData);
      } else {
        finalData = JSON.stringify(exportData, null, 2);
      }

      // Encryption
      if (encrypted && cryptoManager.isInitialized()) {
        try {
          const encryptedData = await cryptoManager.encryptEvent({ 
            type: 'user_data_export',
            data: finalData 
          });
          finalData = encryptedData;
          logger.cryptoOperation('export_encrypt', true);
        } catch (error) {
          logger.error('EXPORT', 'Failed to encrypt export data', {}, error as Error);
          logger.cryptoOperation('export_encrypt', false, (error as Error).message);
          throw new Error('Export encryption failed');
        }
      }

      const result: ExportResult = {
        data: finalData,
        metadata: {
          exportedAt: new Date().toISOString(),
          userId,
          recordCount: totalRecords,
          format,
          encrypted
        }
      };

      logger.info('EXPORT', 'Data export completed successfully', { 
        userId, 
        recordCount: totalRecords,
        format,
        encrypted 
      });
      timer();

      return result;

    } catch (error) {
      timer();
      logger.error('EXPORT', 'Data export failed', { 
        userId, 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  /**
   * Import user data from exported file
   */
  async importUserData(exportData: string, isEncrypted: boolean = true): Promise<void> {
    const timer = logger.startTimer('DataExport:importUserData');
    logger.info('EXPORT', 'Starting data import');

    try {
      let parsedData;

      // Decrypt if needed
      if (isEncrypted) {
        if (!cryptoManager.isInitialized()) {
          throw new Error('Crypto system not initialized for import');
        }

        const decryptedResult = await cryptoManager.decryptEvent(exportData);
        if (!decryptedResult || typeof decryptedResult !== 'object' || !('data' in decryptedResult)) {
          throw new Error('Invalid encrypted export data');
        }
        parsedData = JSON.parse((decryptedResult as any).data);
      } else {
        parsedData = JSON.parse(exportData);
      }

      // Validate export format
      if (!parsedData.version || !parsedData.userId) {
        throw new Error('Invalid export format');
      }

      // Import in transaction
      await database.write(async () => {
        // Import events
        if (parsedData.events && Array.isArray(parsedData.events)) {
          const eventsCollection = database.collections.get('events');
          for (const eventData of parsedData.events) {
            const encryptedPayload = eventData.data ? await cryptoManager.encryptEvent(eventData.data) || '' : '';
            await eventsCollection.create((event: any) => {
              event.eventType = eventData.eventType;
              event.timestamp = new Date(eventData.timestamp).getTime();
              event.encryptedPayload = encryptedPayload;
              event.workspaceId = eventData.workspaceId;
              event.isSynced = false; // Re-sync after import
            });
          }
          logger.info('EXPORT', 'Imported events', { count: parsedData.events.length });
        }

        // Import tasks
        if (parsedData.tasks && Array.isArray(parsedData.tasks)) {
          const tasksCollection = database.collections.get('tasks');
          for (const taskData of parsedData.tasks) {
            await tasksCollection.create((task: any) => {
              task.title = taskData.title;
              task.description = taskData.description || '';
              task.status = taskData.status;
              task.priority = taskData.priority;
              task.category = taskData.category;
              task.dueDate = taskData.dueDate ? new Date(taskData.dueDate).getTime() : null;
              task.estimatedDuration = taskData.estimatedDuration;
              task.actualDuration = taskData.actualDuration;
              task.tags = JSON.stringify(taskData.tags || []);
              task.workspaceId = taskData.workspaceId;
              task.parentTaskId = taskData.parentTaskId;
              task.isSynced = false; // Re-sync after import
            });
          }
          logger.info('EXPORT', 'Imported tasks', { count: parsedData.tasks.length });
        }
      });

      logger.info('EXPORT', 'Data import completed successfully');
      timer();

    } catch (error) {
      timer();
      logger.error('EXPORT', 'Data import failed', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  /**
   * Convert JSON data to CSV format
   */
  private convertToCSV(data: any): string {
    const csvSections = [];

    // Convert events to CSV
    if (data.events && data.events.length > 0) {
      const eventHeaders = ['id', 'eventType', 'timestamp', 'workspaceId', 'data'];
      const eventRows = data.events.map((event: any) => [
        event.id,
        event.eventType,
        event.timestamp,
        event.workspaceId,
        JSON.stringify(event.data)
      ]);
      
      csvSections.push('EVENTS');
      csvSections.push(eventHeaders.join(','));
      csvSections.push(...eventRows.map((row: any[]) => row.join(',')));
      csvSections.push('');
    }

    // Convert tasks to CSV
    if (data.tasks && data.tasks.length > 0) {
      const taskHeaders = ['id', 'title', 'description', 'status', 'priority', 'category', 'dueDate', 'tags'];
      const taskRows = data.tasks.map((task: any) => [
        task.id,
        task.title,
        task.description || '',
        task.status,
        task.priority,
        task.category,
        task.dueDate || '',
        task.tags.join(';')
      ]);
      
      csvSections.push('TASKS');
      csvSections.push(taskHeaders.join(','));
      csvSections.push(...taskRows.map((row: any[]) => row.join(',')));
      csvSections.push('');
    }

    return csvSections.join('\n');
  }

  /**
   * Download export data as file
   */
  downloadExport(exportResult: ExportResult, filename?: string): void {
    try {
      const { data, metadata } = exportResult;
      const finalFilename = filename || 
        `lifecmd_export_${metadata.userId}_${new Date().toISOString().split('T')[0]}.${metadata.format}`;

      // Create blob and download
      const blob = new Blob([data], { 
        type: metadata.format === 'csv' ? 'text/csv' : 'application/json' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logger.info('EXPORT', 'Export file downloaded', { 
        filename: finalFilename,
        recordCount: metadata.recordCount 
      });

    } catch (error) {
      logger.error('EXPORT', 'Download failed', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  /**
   * Get export statistics
   */
  async getExportStats(userId: string): Promise<{
    totalEvents: number;
    totalTasks: number;
    totalWorkspaces: number;
    oldestEvent?: Date;
    newestEvent?: Date;
  }> {
    try {
      const eventsCollection = database.collections.get('events');
      const tasksCollection = database.collections.get('tasks');
      const workspacesCollection = database.collections.get('workspaces');

      const [events, tasks, workspaces] = await Promise.all([
        eventsCollection.query().fetch(),
        tasksCollection.query().fetch(),
        workspacesCollection.query().fetch()
      ]);

      let oldestEvent: Date | undefined;
      let newestEvent: Date | undefined;

      if (events.length > 0) {
        // Type cast to Event[] for property access
        const timestamps = (events as Event[]).map(e => new Date(e.timestamp));
        oldestEvent = new Date(Math.min(...timestamps.map(d => d.getTime())));
        newestEvent = new Date(Math.max(...timestamps.map(d => d.getTime())));
      }

      return {
        totalEvents: events.length,
        totalTasks: tasks.length,
        totalWorkspaces: workspaces.length,
        oldestEvent,
        newestEvent
      };

    } catch (error) {
      logger.error('EXPORT', 'Failed to get export stats', { 
        userId, 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }
}

export const dataExportService = DataExportService.getInstance();
