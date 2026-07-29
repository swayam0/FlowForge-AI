'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { Check, X, Search, MoreVertical, Clock, User, CheckCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

function EmptyState({ icon: Icon, title, description }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-[#0a0a0a] rounded-xl border border-[#27272a] shadow-sm w-full">
      <div className="h-20 w-20 rounded-3xl bg-[#111111] flex items-center justify-center mb-6 border border-[#27272a] shadow-inner">
        <Icon className="h-10 w-10 text-green-500 opacity-80" />
      </div>
      <h3 className="text-xl font-bold text-primary mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function ApprovalsPage() {
  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => api.getApprovals(),
  });

  const approvals = approvalsData || [];
  
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [filter, setFilter] = useState('ALL');
  const queryClient = useQueryClient();

  const handleActionClick = (approval: any, type: 'APPROVED' | 'REJECTED') => {
    setSelectedApproval(approval);
    setActionType(type);
    setComments('');
  };

  const submitAction = async () => {
    if (!selectedApproval || !actionType) return;
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
    } catch (err) {
      toast.error('Failed to submit approval');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full space-y-8 h-full flex flex-col">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#27272a] shrink-0">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Approval Queue</h1>
          <p className="text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Review and action pending tasks that require human authorization before resuming execution.
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <section className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0a0a0a] p-4 rounded-xl border border-[#27272a] shrink-0 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline transition-colors" />
          <input 
            className="w-full bg-[#111111] border border-[#27272a] rounded-lg py-2.5 pl-12 pr-4 text-sm font-medium text-primary placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 transition-colors" 
            placeholder="Search execution ID, workflow, or keyword..." 
            type="text"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {['ALL', 'HIGH PRIORITY', 'PENDING', 'MY ASSIGNMENTS'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
                filter === f 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-[#111111] border border-[#27272a] text-on-surface-variant hover:text-primary hover:bg-[#27272a]/50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Approval Cards List */}
      <div className="space-y-4 flex-1">
        {approvals.map((approval: any) => (
          <article key={approval.id} className="bg-[#0a0a0a] border border-[#27272a] p-6 rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-[#3b82f6]/50 transition-colors group">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-primary group-hover:text-blue-500 transition-colors">{approval.workflowName}</h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-outline bg-[#111111] px-2.5 py-1 border border-[#27272a] rounded">
                  #{approval.executionId}
                </span>
                
                {approval.priority === 'HIGH' && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-red-500/30 text-red-500 bg-red-500/10 rounded">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span> HIGH PRIORITY
                  </span>
                )}
                {approval.priority === 'MEDIUM' && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-blue-500/30 text-blue-500 bg-blue-500/10 rounded">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> MEDIUM
                  </span>
                )}
                {approval.priority === 'LOW' && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-gray-500/30 text-gray-400 bg-gray-500/10 rounded">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span> LOW
                  </span>
                )}
              </div>
              
              <div className="bg-[#111111] p-4 rounded-lg border border-[#27272a]">
                <p className="text-sm font-medium text-on-surface-variant max-w-3xl leading-relaxed">{approval.reason}</p>
              </div>
              
              <div className="flex items-center gap-6 pt-1">
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-outline">
                  <Clock className="h-3.5 w-3.5" /> 
                  {format(new Date(approval.timestamp), 'p')}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-outline">
                  <User className="h-3.5 w-3.5" /> Assigned to: <strong className="text-primary font-medium">Me</strong>
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button 
                onClick={() => handleActionClick(approval, 'APPROVED')} 
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all"
              >
                Approve
              </button>
              <button 
                onClick={() => handleActionClick(approval, 'REJECTED')} 
                className="px-6 py-2.5 border border-[#27272a] bg-[#111111] hover:bg-[#1c1b1b] text-red-500 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              >
                Reject
              </button>
              <button className="p-2.5 text-outline hover:text-primary hover:bg-[#27272a] rounded-lg transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </article>
        ))}

        {approvals?.length === 0 && (
          <EmptyState 
            icon={ShieldCheck} 
            title="You're all caught up!" 
            description="There are no pending approvals requiring your attention at this time." 
          />
        )}
      </div>

      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            {actionType === 'APPROVED' ? 'Approve Step' : 'Reject Step'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <label className="text-sm font-bold text-primary mb-2 block">Comments (optional)</label>
          <Input 
            className="w-full bg-[#0a0a0a] border-[#27272a] text-primary focus:border-blue-500 rounded-lg p-3" 
            placeholder="Add a reason for this decision..." 
            value={comments} 
            onChange={(e: any) => setComments(e.target.value)}
          />
        </div>
        <DialogFooter className="gap-3">
          <button 
            className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors" 
            onClick={() => setSelectedApproval(null)}
          >
            Cancel
          </button>
          <button 
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all text-white",
              actionType === 'APPROVED' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
            )}
            onClick={submitAction}
          >
            Confirm {actionType === 'APPROVED' ? 'Approval' : 'Rejection'}
          </button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
