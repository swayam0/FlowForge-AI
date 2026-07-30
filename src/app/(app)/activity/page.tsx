'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AuditFilterBar } from '@/components/audit/AuditFilterBar';
import { AuditTimeline } from '@/components/audit/AuditTimeline';
import { AuditEventDrawer } from '@/components/audit/AuditEventDrawer';
import { Download, FileJson, Printer, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Filters {
  range: string;
  search: string;
  eventType: string;
}

export default function ActivityPage() {
  const [filters, setFilters] = useState<Filters>({ range: '7d', search: '', eventType: '' });
  const [cursor, setCursor]   = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Reset log list when filters change
  const filterKey = JSON.stringify({ ...filters, cursor: null });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['audit', filters, cursor],
    queryFn: () => api.getAuditLogs({ ...filters, cursor: cursor ?? undefined, limit: 50 }),
  });

  useEffect(() => {
    if (data?.logs) {
      if (!cursor) {
        setAllLogs(data.logs);
      } else {
        setAllLogs(prev => [...prev, ...data.logs]);
      }
    }
  }, [data, cursor]);

  // Reset on filter change
  const prevFilterRef = useRef(filterKey);
  if (prevFilterRef.current !== filterKey) {
    prevFilterRef.current = filterKey;
    setCursor(null);
    setAllLogs([]);
  }

  const handleFilterChange = useCallback((partial: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
    setCursor(null);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (data?.nextCursor) setCursor(data.nextCursor);
  }, [data?.nextCursor]);

  const handleExport = (format: 'csv' | 'json') => {
    const url = api.exportAuditLogs(filters.range, format);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${filters.range}.${format}`;
    a.click();
    toast.success(`Exporting ${format.toUpperCase()}…`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Activity Center</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Complete audit trail of all product activity.</p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => handleExport('csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-border hover:border-white/20 rounded-lg transition-colors">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={() => handleExport('json')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-border hover:border-white/20 rounded-lg transition-colors">
            <FileJson className="h-3.5 w-3.5" /> JSON
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-border hover:border-white/20 rounded-lg transition-colors">
            <Printer className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{allLogs.length}</p>
            <p className="text-xs text-gray-500 mt-1">Events Shown</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{allLogs.filter((l: any) => l.eventType?.includes('COMPLETED') || l.eventType?.includes('APPROVED')).length}</p>
            <p className="text-xs text-gray-500 mt-1">Successful</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{allLogs.filter((l: any) => l.eventType?.includes('FAILED') || l.eventType?.includes('REJECTED') || l.eventType?.includes('DELETED')).length}</p>
            <p className="text-xs text-gray-500 mt-1">Critical</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <AuditFilterBar filters={filters} onChange={handleFilterChange} />

      {/* Main content */}
      <div className="flex gap-6 relative">
        <div className={`flex-1 min-w-0 transition-all duration-300 ${selectedLog ? 'md:mr-[440px]' : ''}`}>
          <AuditTimeline
            logs={allLogs}
            onSelect={setSelectedLog}
            selectedId={selectedLog?._id ?? selectedLog?.id}
            hasMore={data?.hasMore ?? false}
            onLoadMore={handleLoadMore}
            isLoading={isLoading || isFetching}
          />
        </div>
      </div>

      {/* Drawer */}
      {selectedLog && (
        <AuditEventDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
