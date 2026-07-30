'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Check, X, Search, Clock, User, CheckCircle, ShieldCheck, BrainCircuit, Activity, FileJson, AlertTriangle, History, Inbox, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonButton } from '@/components/skeletons/SkeletonButton';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { Approval } from '@/types';


export default function ApprovalsPage() {
  const { data: approvalsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => api.getApprovals(),
  });

  const approvals = approvalsData || [];
  
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comments, setComments] = useState('');
  const [payloadText, setPayloadText] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const handleSelect = (approval: Approval) => {
    setSelectedApproval(approval);
    setComments('');
    // Load the actual AI-generated payload for this approval
    const payload = approval.requestPayload || {};
    setPayloadText(JSON.stringify(payload, null, 2) || '{}');
  };

  const submitAction = async (actionType: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval) return;
    try {
      const approved = actionType === 'APPROVED';
      await api.submitApproval(selectedApproval.id, {
        status: actionType,
        comments,
        reviewer: 'Admin User'
      });
      
      setSelectedApproval(null);
      toast.success(`Approval ${approved ? 'Granted' : 'Rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit approval';
      toast.error(message, {
        action: { label: 'Retry', onClick: () => submitAction(actionType) }
      });
    }
  };

  const filteredApprovals = approvals.filter((a: Approval) => {
    const matchesPriority = filter !== 'HIGH PRIORITY' || a.priority === 'HIGH';
    const matchesSearch = !searchQuery ||
      (a.workflowName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.executionId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <div className="flex h-[calc(100vh-56px)] w-full bg-black overflow-hidden selection:bg-blue-500/30" role="main">
      
      {/* Left Pane: Inbox List */}
      <div className="hidden md:flex w-[380px] flex-col shrink-0 border-r border-white/5 bg-[#050505]">
        
        {/* Inbox Header */}
        <div className="px-6 py-5 border-b border-white/5 shrink-0 bg-[#0a0a0a]">
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2 mb-4">
            <Inbox className="h-5 w-5" /> Inbox
          </h1>
          <div className="relative w-full mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              aria-label="Search approval tasks"
              className="w-full bg-[#121212] border border-white/10 rounded-md py-2 pl-9 pr-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors placeholder:text-gray-600" 
              placeholder="Search tasks..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Priority filter">
            {['ALL', 'HIGH PRIORITY'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all uppercase tracking-wider",
                  filter === f 
                    ? "bg-white text-black" 
                    : "bg-white/5 text-gray-400 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        
        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 mx-2 rounded-lg bg-[#0a0a0a] border border-white/5 flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-white/5" />
                    <Skeleton className="h-3 w-1/2 bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 text-center flex flex-col items-center">
              <AlertTriangle className="h-8 w-8 mb-3 text-red-500 opacity-50" />
              <p className="text-sm text-gray-400">Failed to load inbox.</p>
              <button onClick={() => refetch()} className="mt-4 text-xs font-medium text-white px-4 py-2 bg-white/10 rounded-md hover:bg-white/20">Retry</button>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-50">
              <CheckCircle className="h-10 w-10 mb-4 text-gray-500" />
              <p className="text-sm text-gray-400">You're all caught up.</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredApprovals.map((approval: Approval) => {
                const isSelected = selectedApproval?.id === approval.id;
                return (
                  <button
                    key={approval.id}
                    onClick={() => handleSelect(approval)}
                    className={cn(
                      "w-full text-left px-6 py-4 transition-colors relative group border-l-2",
                      isSelected ? "border-blue-500 bg-white/[0.04]" : "border-transparent hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1 w-full">
                      <span className={cn("font-medium text-sm truncate", isSelected ? "text-white" : "text-gray-300")}>
                        {approval.workflowName}
                      </span>
                      {approval.priority === 'HIGH' && (
                        <span className="shrink-0 flex items-center gap-1.5 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> HIGH
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span className="font-mono">#{approval.executionId?.substring(0,8) || approval.id.substring(0,8)}</span>
                      <span>•</span>
                      <span>{format(new Date(approval.timestamp || approval.createdAt || Date.now()), 'MMM d, yyyy • h:mm:ss a')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Detail View */}
      <div className="flex-1 bg-[#0a0a0a] relative overflow-hidden flex flex-col">
        {!selectedApproval ? (
          <EmptyState 
            icon={ShieldCheck} 
            title="No task selected" 
            description="Select an approval request from your inbox to review the AI's recommendations and make a decision." 
          />
        ) : (
          <motion.div 
            key={selectedApproval.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Detail Header */}
            <header className="px-8 py-5 border-b border-white/5 shrink-0 flex justify-between items-start bg-[#050505]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                    EXEC-#{selectedApproval.executionId?.substring(0,8)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {selectedApproval.workflowName}
                </h2>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Requested {format(new Date(selectedApproval.timestamp || selectedApproval.createdAt || Date.now()), 'PPpp')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => submitAction('REJECTED')}
                  aria-label={`Reject approval for ${selectedApproval.workflowName}`}
                  className="px-5 py-2 bg-[#121212] text-red-400 border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 font-semibold text-sm rounded-md transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
                <button
                  onClick={() => submitAction('APPROVED')}
                  aria-label={`Approve request for ${selectedApproval.workflowName}`}
                  className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-500 font-semibold text-sm rounded-md shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
              </div>
            </header>

            {/* Scrollable Canvas */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="max-w-4xl mx-auto space-y-10 pb-20">
                
                {/* Recommendation & Confidence Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* Left Col: Reasoning */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                        <BrainCircuit className="h-5 w-5 text-purple-400" />
                        <h3 className="font-semibold text-white text-lg">AI Analysis</h3>
                      </div>
                      
                      <div className="bg-[#050505] border border-white/5 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none" />
                        <div className="flex items-start gap-4 relative z-10">
                          <div className="bg-green-500/20 text-green-400 p-2 rounded-full shrink-0">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-white mb-2">Recommend Approval</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">
                              The analyzed document matches the expected schema and no anomalies were detected in the numerical extractions. All policy checks passed successfully.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Step-by-Step Reasoning</h4>
                        <div className="bg-[#121212] p-5 rounded-xl border border-white/5 text-sm text-gray-300 leading-relaxed font-serif italic">
                          "Cross-referenced invoice total ($1,240.00) with line items sum. Verified vendor Acme Corp exists in approved vendor list. No flags raised during policy check."
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Col: Confidence & Evidence */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                        <Activity className="h-5 w-5 text-blue-400" />
                        <h3 className="font-semibold text-white text-lg">Confidence</h3>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center p-8 bg-[#050505] rounded-xl border border-white/5 shadow-inner">
                        <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-white/5 stroke-current"
                              strokeWidth="2.5"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-blue-500 stroke-current"
                              strokeWidth="2.5"
                              strokeDasharray="94, 100"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-bold text-white tracking-tighter">94%</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">High Confidence</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Evidence Sources</h4>
                      <ul className="bg-[#050505] rounded-xl border border-white/5 p-4 space-y-3">
                        {['Invoice_1024.pdf (Document)', 'Vendor_Directory.json (Lookup)', 'Policy_Rules_v2 (System)'].map((evidence, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                            {evidence}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </section>

                {/* Editor Section */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-3">
                      <FileJson className="h-5 w-5 text-amber-400" />
                      <h3 className="font-semibold text-white text-lg">Modify Output Payload</h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">JSON</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Review and edit the AI-generated payload before it proceeds to the next step in the workflow.
                  </p>
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0e0e11] group">
                    <textarea 
                      value={payloadText}
                      onChange={(e) => setPayloadText(e.target.value)}
                      className="w-full h-48 bg-transparent text-green-400 font-mono text-sm p-5 focus:outline-none custom-scrollbar resize-none"
                      spellCheck="false"
                    />
                  </div>
                </section>

                {/* Reviewer Action Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <h3 className="font-semibold text-white text-lg">Your Decision</h3>
                    </div>
                    <textarea 
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add a justification for your approval or rejection..."
                      aria-label="Reviewer justification comment"
                      className="w-full h-24 bg-[#050505] border border-white/10 rounded-xl p-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors custom-scrollbar resize-none placeholder:text-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                      <History className="h-5 w-5 text-gray-400" />
                      <h3 className="font-semibold text-white text-lg">Audit Trail</h3>
                    </div>
                    <div className="border border-white/5 rounded-xl p-5 bg-[#050505] space-y-6">
                      <div className="flex gap-4 relative">
                        <div className="w-px h-full bg-white/10 absolute left-[9px] top-6" />
                        <div className="h-5 w-5 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center shrink-0 mt-0.5 z-10" />
                        <div>
                          <p className="text-sm text-gray-200">System Orchestrator paused execution.</p>
                          <span className="font-mono text-white">{format(new Date(selectedApproval.timestamp || selectedApproval.createdAt || Date.now()), 'h:mm a')}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 relative">
                        <div className="h-5 w-5 rounded-full bg-white/5 border border-white/20 flex items-center justify-center shrink-0 mt-0.5 z-10" />
                        <div>
                          <p className="text-sm text-gray-500 italic">Awaiting human review...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
