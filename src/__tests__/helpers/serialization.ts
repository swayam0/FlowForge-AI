import { expect } from 'vitest';

/**
 * Validates that an API response data payload containing MongoDB documents 
 * has been properly serialized (i.e., has an `id` string and does not have Mongoose internals).
 */
export function assertSerializedDocument(data: any) {
  expect(data).toBeDefined();
  
  if (Array.isArray(data)) {
    data.forEach(item => assertSerializedDocument(item));
    return;
  }
  
  // A properly serialized document should have the virtual `id` field
  expect(data.id, 'Expected document to have a populated "id" field').toBeDefined();
  expect(typeof data.id, 'Expected "id" to be a string').toBe('string');
  
  // It shouldn't expose internal Mongoose properties like $__ or _doc
  expect(data.$__, 'Document appears to be a raw Mongoose Document').toBeUndefined();
  expect(data._doc, 'Document appears to be a raw Mongoose Document').toBeUndefined();
}
