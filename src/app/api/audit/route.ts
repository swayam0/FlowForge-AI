export const dynamic = 'force-dynamic';
import { successResponse, errorResponse } from '../responseHelper';
import connectToDatabase from '../../../utils/db';
import { AuditLogModel } from '../../../models/AuditLog';
import { AuditEventType } from '../../../types/auditLog';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit    = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const cursor   = searchParams.get('cursor'); // last _id for cursor pagination
    const search   = searchParams.get('search') || '';
    const eventType = searchParams.get('eventType') || '';
    const workflowId = searchParams.get('workflowId') || '';
    const range    = searchParams.get('range') || '7d';

    let days = 7;
    if (range === '24h') days = 1;
    else if (range === '30d') days = 30;
    else if (range === 'all') days = 3650;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const filter: Record<string, any> = { createdAt: { $gte: startDate } };

    if (cursor) {
      filter._id = { $lt: cursor };
    }
    if (eventType) {
      filter.eventType = eventType;
    }
    if (workflowId) {
      filter.workflowId = workflowId;
    }
    if (search) {
      filter.$or = [
        { summary:    { $regex: search, $options: 'i' } },
        { actor:      { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
        { runId:      { $regex: search, $options: 'i' } },
      ];
    }

    const logs = await AuditLogModel
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = logs.length > limit;
    const data = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? String(data[data.length - 1]._id) : null;

    return successResponse({ logs: data, nextCursor, hasMore }, 'Audit logs retrieved');
  } catch (error) {
    return errorResponse('Failed to retrieve audit logs', error, 500);
  }
}
