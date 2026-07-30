'use client';

import React, { useCallback } from 'react';
import { format } from 'date-fns';
import { EventBadge, getEventConfig } from './AuditEventConfig';
import { ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditTimelineProps {
  logs: any[];
  onSelect: (log: any) => void;
  selectedId?: string;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}

function TimelineRow({ log, onSelect, isSelected, isLast }: { log: any; onSelect: (log: any) => void; isSelected: boolean; isLast: boolean }) {
  const cfg = getEventConfig(log.eventType);
  const Icon = cfg.icon;

  return (
    <div className="flex gap-4 group cursor-pointer" onClick={() => onSelect(log)}>
      {/* Left: timeline bar */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${isSelected ? `${cfg.bg} ${cfg.border} ring-2 ring-blue-500/40` : `${cfg.bg} ${cfg.border}`} transition-all`}>
          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-white/5 mt-1" />}
      </div>

      {/* Right: content */}
      <div className={`flex-1 pb-6 pt-0.5 ${isLast ? '' : ''}`}>
        <div className={`p-3 rounded-lg border transition-all ${isSelected ? 'bg-white/[0.04] border-white/10' : 'bg-transparent border-transparent group-hover:bg-white/[0.02] group-hover:border-white/5'}`}>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap items-center gap-2">
              <EventBadge eventType={log.eventType} />
              <span className="text-sm text-gray-300 font-medium">{log.summary}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-gray-500 font-mono">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{log.actor}</span>
            {log.resourceId && <span className="font-mono truncate max-w-[140px]">{log.resourceId.substring(0, 12)}…</span>}
            {log.runId && <span className="font-mono hidden sm:block truncate max-w-[140px]">run:{log.runId.substring(0, 8)}…</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditTimeline({ logs, onSelect, selectedId, hasMore, onLoadMore, isLoading }: AuditTimelineProps) {
  if (!isLoading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <p className="text-gray-400 font-medium">No audit events found</p>
        <p className="text-gray-600 text-sm mt-1">Events will appear here once you start using FlowForge AI.</p>
      </div>
    );
  }

  // Group logs by date
  const groups: Record<string, any[]> = {};
  logs.forEach(log => {
    const dateKey = format(new Date(log.createdAt), 'MMM dd, yyyy');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(log);
  });

  return (
    <div>
      {Object.entries(groups).map(([dateKey, dayLogs]) => (
        <div key={dateKey} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">{dateKey}</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div>
            {dayLogs.map((log, i) => (
              <TimelineRow
                key={log._id ?? log.id}
                log={log}
                onSelect={onSelect}
                isSelected={selectedId === (log._id ?? log.id)}
                isLast={i === dayLogs.length - 1}
              />
            ))}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-border hover:border-white/20 rounded-lg transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
