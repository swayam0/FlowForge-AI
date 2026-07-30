'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { AuditEventType } from '@/types/auditLog';

const ALL_EVENT_TYPES = Object.values(AuditEventType);

interface Filters {
  range: string;
  search: string;
  eventType: string;
}

interface AuditFilterBarProps {
  filters: Filters;
  onChange: (filters: Partial<Filters>) => void;
}

export function AuditFilterBar({ filters, onChange }: AuditFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by user, summary, run ID…"
          value={filters.search}
          onChange={e => onChange({ search: e.target.value })}
          className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        {filters.search && (
          <button onClick={() => onChange({ search: '' })} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Date Range */}
      <div className="flex items-center bg-card border border-border rounded-lg p-1">
        {(['24h', '7d', '30d', 'all'] as const).map(r => (
          <button
            key={r}
            onClick={() => onChange({ range: r })}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filters.range === r ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
          >
            {r === 'all' ? 'All Time' : r}
          </button>
        ))}
      </div>

      {/* Event Type */}
      <select
        value={filters.eventType}
        onChange={e => onChange({ eventType: e.target.value })}
        className="text-sm bg-card border border-border text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
      >
        <option value="">All Event Types</option>
        {ALL_EVENT_TYPES.map(et => (
          <option key={et} value={et}>{et.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}
