import mongoose, { Schema, Document } from 'mongoose';
import { AuditEventType, AuditResourceType } from '../types/auditLog';

export interface IAuditLog extends Document {
  eventType: AuditEventType;
  resourceType: AuditResourceType;
  resourceId: string;
  workflowId?: string;
  runId?: string;
  actor: string;
  summary: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  eventType:    { type: String, enum: Object.values(AuditEventType), required: true, index: true },
  resourceType: { type: String, required: true, index: true },
  resourceId:   { type: String, required: true, index: true },
  workflowId:   { type: String, index: true },
  runId:        { type: String, index: true },
  actor:        { type: String, required: true, default: 'system' },
  summary:      { type: String, required: true },
  oldValue:     { type: Schema.Types.Mixed },
  newValue:     { type: Schema.Types.Mixed },
  metadata:     { type: Schema.Types.Mixed },
  ipAddress:    { type: String, default: '127.0.0.1' },
  userAgent:    { type: String, default: 'FlowForge/Internal' },
  correlationId:{ type: String },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// TTL-safe compound index for fast list queries
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ workflowId: 1, createdAt: -1 });

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
