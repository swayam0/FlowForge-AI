import connectToDatabase from '../utils/db';
import { AuditLogModel } from '../models/AuditLog';
import { AuditEventType, AuditResourceType } from '../types/auditLog';

interface LogEventOptions {
  eventType: AuditEventType;
  resourceType: AuditResourceType;
  resourceId: string;
  workflowId?: string;
  runId?: string;
  actor?: string;
  summary: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  request?: Request;
}

/**
 * Fire-and-forget audit event logger.
 * Never throws – failures are silently caught so that the audit trail
 * never blocks or degrades core functionality.
 */
export async function logAuditEvent(opts: LogEventOptions): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLogModel.create({
      eventType:    opts.eventType,
      resourceType: opts.resourceType,
      resourceId:   opts.resourceId,
      workflowId:   opts.workflowId,
      runId:        opts.runId,
      actor:        opts.actor ?? 'system',
      summary:      opts.summary,
      oldValue:     opts.oldValue,
      newValue:     opts.newValue,
      metadata:     opts.metadata,
      correlationId: opts.correlationId ?? crypto.randomUUID(),
      ipAddress:    '127.0.0.1',
      userAgent:    'FlowForge/Internal',
    });
  } catch (err) {
    // Audit failures must never bubble up
    console.error('[AuditService] Failed to write audit log:', err);
  }
}
