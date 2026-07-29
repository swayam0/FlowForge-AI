'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { format } from 'date-fns';
import { Activity, Clock, Server, AlertCircle } from 'lucide-react';

export function LogsViewer({ executionId }: { executionId: string }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs', executionId],
    queryFn: () => api.getExecutionLogs(executionId),
    refetchInterval: 2000, // Poll every 2 seconds
  });

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Loading logs...</div>;
  if (!logs || logs.length === 0) return <div className="text-sm text-muted-foreground p-4">No logs available.</div>;

  return (
    <div className="flex flex-col gap-2 p-4 max-h-[400px] overflow-y-auto font-mono text-xs">
      {logs.map((log: any) => (
        <div key={log.id} className="flex gap-4 border-b pb-2 last:border-0">
          <div className="text-muted-foreground whitespace-nowrap">
            {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
          </div>
          <div className="w-24 font-semibold text-primary">{log.eventType}</div>
          <div className="flex-1">{log.message}</div>
          {log.metadata?.latencyMs && (
            <div className="text-muted-foreground">{log.metadata.latencyMs}ms</div>
          )}
        </div>
      ))}
    </div>
  );
}
