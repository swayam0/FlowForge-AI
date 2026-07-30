'use client';

import React from 'react';
import { X, ExternalLink, User, Clock, Tag, Link2, FileText, Code } from 'lucide-react';
import { format } from 'date-fns';
import { EventBadge, getEventConfig } from './AuditEventConfig';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

interface AuditEventDrawerProps {
  log: any | null;
  onClose: () => void;
}

function JsonViewer({ data }: { data: any }) {
  if (!data) return <span className="text-gray-600 text-xs italic">—</span>;
  return (
    <pre className="text-xs font-mono text-gray-300 bg-black/40 p-3 rounded-lg overflow-auto max-h-[200px] whitespace-pre-wrap break-all border border-white/5">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

type DrawerTab = 'summary' | 'metadata' | 'diff';

export function AuditEventDrawer({ log, onClose }: AuditEventDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('summary');

  if (!log) return null;
  const cfg = getEventConfig(log.eventType);

  return (
    <AnimatePresence>
      <motion.div
        key="drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      <motion.aside
        key="drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="fixed right-0 top-0 h-screen w-full max-w-[420px] bg-[#0d0d0d] border-l border-border z-50 flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${cfg.bg} border ${cfg.border}`}>
              <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-100">{cfg.label}</p>
              <p className="text-xs text-gray-500">{format(new Date(log.createdAt), 'MMM dd, yyyy · HH:mm:ss')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {(['summary', 'metadata', 'diff'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'summary' && (
            <>
              <div>
                <EventBadge eventType={log.eventType} />
                <p className="text-gray-200 text-sm mt-3 leading-relaxed">{log.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: User,     label: 'Actor',       value: log.actor },
                  { icon: Tag,      label: 'Resource',    value: log.resourceType },
                  { icon: Clock,    label: 'Timestamp',   value: format(new Date(log.createdAt), 'HH:mm:ss') },
                  { icon: Link2,    label: 'Correlation', value: log.correlationId?.substring(0, 12) + '…' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                    <p className="text-xs font-mono text-gray-200 truncate" title={value}>{value ?? '—'}</p>
                  </div>
                ))}
              </div>

              {log.runId && (
                <Link href={`/executions/${log.runId}`} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-blue-500/40 hover:bg-blue-500/5 text-sm text-gray-400 hover:text-blue-400 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                  View Execution
                </Link>
              )}
              {log.workflowId && (
                <Link href={`/workflows/${log.workflowId}`} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-blue-500/40 hover:bg-blue-500/5 text-sm text-gray-400 hover:text-blue-400 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                  View Workflow
                </Link>
              )}
            </>
          )}

          {tab === 'metadata' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider">Resource ID</p>
                <p className="text-xs font-mono text-gray-300 bg-black/40 p-2 rounded border border-white/5 break-all">{log.resourceId}</p>
              </div>
              {log.runId && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider">Run ID</p>
                  <p className="text-xs font-mono text-gray-300 bg-black/40 p-2 rounded border border-white/5 break-all">{log.runId}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider">IP Address</p>
                <p className="text-xs font-mono text-gray-300">{log.ipAddress}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider">User Agent</p>
                <p className="text-xs font-mono text-gray-300">{log.userAgent}</p>
              </div>
              {log.metadata && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider">Metadata</p>
                  <JsonViewer data={log.metadata} />
                </div>
              )}
            </div>
          )}

          {tab === 'diff' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                  <span className="text-red-400">−</span> Old Value
                </p>
                <JsonViewer data={log.oldValue} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                  <span className="text-green-400">+</span> New Value
                </p>
                <JsonViewer data={log.newValue} />
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
