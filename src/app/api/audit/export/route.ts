export const dynamic = 'force-dynamic';
import { errorResponse } from '../../responseHelper';
import connectToDatabase from '../../../../utils/db';
import { AuditLogModel } from '../../../../models/AuditLog';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const range = searchParams.get('range') || '7d';

    let days = 7;
    if (range === '24h') days = 1;
    else if (range === '30d') days = 30;
    else if (range === 'all') days = 3650;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await AuditLogModel
      .find({ createdAt: { $gte: startDate } })
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean()
      .exec();

    if (format === 'csv') {
      const headers = ['id', 'eventType', 'resourceType', 'resourceId', 'actor', 'summary', 'workflowId', 'runId', 'createdAt'];
      const csvRows = [
        headers.join(','),
        ...logs.map(log => headers.map(h => {
          const val = (log as any)[h] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(','))
      ];
      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-${range}.csv"`,
        },
      });
    }

    return new NextResponse(JSON.stringify(logs, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="audit-${range}.json"`,
      },
    });
  } catch (error) {
    return errorResponse('Failed to export audit logs', error, 500);
  }
}
