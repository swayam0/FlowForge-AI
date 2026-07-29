import mongoose, { Schema, Document } from 'mongoose';

export interface IIdempotencyRecord extends Document {
  idempotencyKey: string;
  executionId: string;
  nodeId: string;
  status: string;
  resultPayload: any;
  createdAt: Date;
}

const IdempotencyRecordSchema = new Schema<IIdempotencyRecord>({
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  executionId: { type: String, required: true, index: true },
  nodeId: { type: String, required: true },
  status: { type: String, required: true },
  resultPayload: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const IdempotencyRecordModel = mongoose.models.IdempotencyRecord || mongoose.model<IIdempotencyRecord>('IdempotencyRecord', IdempotencyRecordSchema);
