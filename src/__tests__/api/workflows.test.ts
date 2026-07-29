import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/workflows/route';
import { GET as GET_BY_ID, PUT as PUT_BY_ID } from '@/app/api/workflows/[id]/route';
import { WorkflowRepository } from '@/repositories/WorkflowRepository';
import { assertSerializedDocument } from '../helpers/serialization';

vi.mock('@/utils/db', () => ({
  default: vi.fn().mockResolvedValue(true)
}));

describe('API Routes: Workflows', () => {
  let workflowRepo: WorkflowRepository;

  beforeEach(async () => {
    workflowRepo = new WorkflowRepository();
  });

  it('POST /api/workflows should create a new workflow', async () => {
    const req = new Request('http://localhost/api/workflows', {
      method: 'POST',
      body: JSON.stringify({ name: 'API Test Workflow', nodes: [], edges: [] })
    });

    const res = await POST(req);
    
    expect(res.status).toBe(201);
    const result = await res.json();
    expect(result.data.name).toBe('API Test Workflow');
  });

  it('GET /api/workflows should list workflows', async () => {
    await workflowRepo.create({ name: 'List Test Workflow', nodes: [], edges: [] }, 'test');

    const req = new Request('http://localhost/api/workflows');
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    assertSerializedDocument(result.data);
  });

  it('GET /api/workflows/[id] should return a specific workflow', async () => {
    const workflow = await workflowRepo.create({ name: 'Single Test Workflow', nodes: [], edges: [] }, 'test');

    const req = new Request('http://localhost/api/workflows/' + workflow.id);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: workflow.id as string }) });
    
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.data.name).toBe('Single Test Workflow');
    assertSerializedDocument(result.data);
  });

  it('PUT /api/workflows/[id] should successfully update a newly created workflow', async () => {
    // 1. Create it via API
    const createReq = new Request('http://localhost/api/workflows', {
      method: 'POST',
      body: JSON.stringify({ name: 'Edit Test Workflow', nodes: [], edges: [] })
    });
    const createRes = await POST(createReq);
    const createData = await createRes.json();
    const newId = createData.data.id;

    expect(newId).toBeDefined();

    // 2. Fetch it via API (to simulate how the UI gets initialWorkflow)
    const getReq = new Request(`http://localhost/api/workflows/${newId}`);
    const getRes = await GET_BY_ID(getReq, { params: Promise.resolve({ id: newId }) });
    const getData = await getRes.json();
    
    // The returned initialWorkflow should definitely have an id field serialized
    expect(getData.data.id).toBe(newId);
    assertSerializedDocument(getData.data);

    // 3. Edit it via API
    const updateReq = new Request(`http://localhost/api/workflows/${getData.data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Edited Test Workflow', nodes: [], edges: [] })
    });
    const updateRes = await PUT_BY_ID(updateReq, { params: Promise.resolve({ id: getData.data.id }) });
    
    // Should return 200 without a "Workflow not found" or 400 validation error
    expect(updateRes.status).toBe(200);
    
    const updateData = await updateRes.json();
    expect(updateData.data.name).toBe('Edited Test Workflow');
    expect(updateData.data.version).toBe(2);
  });
});
