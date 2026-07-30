export const dynamic = 'force-dynamic';
import { successResponse, errorResponse } from '../../responseHelper';
import connectToDatabase from '../../../../utils/db';
import { AuditLogModel } from '../../../../models/AuditLog';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    const log = await AuditLogModel.findById(params.id).lean().exec();
    if (!log) return errorResponse('Audit log not found', null, 404);
    return successResponse(log, 'Audit log retrieved');
  } catch (error) {
    return errorResponse('Failed to retrieve audit log', error, 500);
  }
}
