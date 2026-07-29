import crypto from 'crypto';

export function generatePayloadHash(payload: any): string {
  const serialized = JSON.stringify(payload || {});
  return crypto.createHash('sha256').update(serialized).digest('hex');
}
