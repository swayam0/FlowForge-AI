export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../responseHelper';
import connectToDatabase from '../../../utils/db';
import { WorkflowRepository } from '../../../repositories/WorkflowRepository';
import { CreateWorkflowSchema } from '../../../validators/workflow.schema';

// Since we are in app router, we can instantiate the repo here or use dependency injection pattern 
const workflowRepo = new WorkflowRepository();

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const workflows = await workflowRepo.list(skip, limit);
    return successResponse(workflows, 'Workflows retrieved successfully');
  } catch (error) {
    return errorResponse('Failed to retrieve workflows', error, 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    console.log(`[API POST /workflows] Payload received for new workflow:`, body.name);

    if (!body.name) {
      return errorResponse('Workflow name is required', null, 400);
    }
    
    const createdBy = body.createdBy || 'anonymous'; // Auth not implemented yet
    
    const workflow = await workflowRepo.create(body, createdBy);
    
    const workflowJson = workflow.toJSON();
    
    return successResponse(workflowJson, 'Workflow created successfully', 201);
  } catch (error: any) {
    console.error(`[API POST /workflows] Failed to create workflow:`, error.issues || error);
    return errorResponse('Failed to create workflow', error, 400);
  }
}
