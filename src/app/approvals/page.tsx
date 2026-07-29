'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { Check, X, Search, MoreVertical, Clock, User, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';

const MOCK_APPROVALS = [
  { id: 'app-1', executionId: 'EX-90221', workflowName: 'Data_Pipeline_Alpha', reason: 'Anomaly detected in extraction layer - requires manual verification.', timestamp: Date.now() - 120000, status: 'PENDING', priority: 'HIGH' },
  { id: 'app-2', executionId: 'EX-88412', workflowName: 'Model_Refinement_Beta', reason: 'Validation gate triggered: Model drift detected in prediction accuracy.', timestamp: Date.now() - 840000, status: 'PENDING', priority: 'MEDIUM' },
  { id: 'app-3', executionId: 'EX-90119', workflowName: 'Ingest_Listener_01', reason: 'Scheduled maintenance override requested.', timestamp: Date.now() - 3600000, status: 'PENDING', priority: 'LOW' },
];

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState(MOCK_APPROVALS);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);
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
      if (!selectedApproval.id.startsWith('app-')) {
        await api.submitApproval(selectedApproval.id, {
          status: actionType,
          comments,
          reviewer: 'Admin User'
        });
      }
      
      setApprovals(approvals.filter(a => a.id !== selectedApproval.id));
      setSelectedApproval(null);
      toast.success(`Approval ${approved ? 'Granted' : 'Rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['history'] });
    } catch (err) {
      toast.error('Failed to submit approval');
    }
  };

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto pb-12 pt-6">
      {/* Filter Section */}
      <section className="mb-8 space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          <input 
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-3 pl-12 pr-4 font-body-sm text-primary placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-0 transition-all" 
            placeholder="Search execution ID, workflow, or keyword..." 
            type="text"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-caps hover:opacity-90 transition-all">ALL</button>
          <button className="whitespace-nowrap px-4 py-1.5 rounded-full border border-outline-variant bg-surface-container-low text-on-surface-variant font-label-caps hover:bg-surface-container-high hover:text-primary transition-all">HIGH PRIORITY</button>
          <button className="whitespace-nowrap px-4 py-1.5 rounded-full border border-outline-variant bg-surface-container-low text-on-surface-variant font-label-caps hover:bg-surface-container-high hover:text-primary transition-all">PENDING</button>
          <button className="whitespace-nowrap px-4 py-1.5 rounded-full border border-outline-variant bg-surface-container-low text-on-surface-variant font-label-caps hover:bg-surface-container-high hover:text-primary transition-all">MY ASSIGNMENTS</button>
        </div>
      </section>

      {/* Approval Cards List */}
      <div className="space-y-4">
        {approvals.map((approval) => (
          <article key={approval.id} className="bg-surface-container-low border border-outline-variant p-5 rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-outline transition-colors group">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-headline-md text-primary">{approval.workflowName}</h3>
                <span className="font-label-mono text-on-surface-variant bg-surface-container px-2 py-0.5 border border-outline-variant rounded">#{approval.executionId}</span>
                
                {approval.priority === 'HIGH' && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 font-label-mono border border-red-500/30 text-red-400 bg-red-500/10 rounded">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span> HIGH PRIORITY
                  </span>
                )}
                {approval.priority === 'MEDIUM' && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 font-label-mono border border-blue-500/30 text-blue-400 bg-blue-500/10 rounded">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> MEDIUM
                  </span>
                )}
                {approval.priority === 'LOW' && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 font-label-mono border border-outline-variant text-on-surface-variant bg-surface-container/50 rounded">
                    <span className="w-1.5 h-1.5 bg-outline rounded-full"></span> LOW
                  </span>
                )}
              </div>
              
              <p className="font-body-sm text-on-surface-variant max-w-2xl">{approval.reason}</p>
              
              <div className="flex items-center gap-4 pt-1">
                <span className="flex items-center gap-1 font-label-mono text-on-surface-variant">
                  <Clock className="h-4 w-4" /> 
                  {format(new Date(approval.timestamp), 'p')}
                </span>
                <span className="flex items-center gap-1 font-label-mono text-on-surface-variant">
                  <User className="h-4 w-4" /> Assigned to: Me
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button 
                onClick={() => handleActionClick(approval, 'APPROVED')} 
                className="px-6 py-2 bg-primary text-on-primary font-label-caps rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
              >
                APPROVE
              </button>
              <button 
                onClick={() => handleActionClick(approval, 'REJECTED')} 
                className="px-6 py-2 border border-outline-variant bg-transparent text-primary font-label-caps rounded-lg hover:bg-surface-container-high active:scale-[0.98] transition-all"
              >
                REJECT
              </button>
              <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </article>
        ))}

        {approvals?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-[#0a0a0a] rounded-xl border border-white/5 shadow-inner">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 border-dashed">
               <CheckCircle className="w-8 h-8 opacity-50 text-green-500" />
             </div>
             <p className="font-semibold text-white mb-1">You're all caught up!</p>
             <p className="text-sm">There are no pending approvals requiring your attention.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogHeader>
          <DialogTitle>{actionType === 'APPROVED' ? 'Approve' : 'Reject'} Step</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium">Comments (optional)</label>
          <Input 
            className="mt-2 bg-surface-container-low border-outline-variant text-primary" 
            placeholder="Add a reason for this decision..." 
            value={comments} 
            onChange={(e: any) => setComments(e.target.value)}
          />
        </div>
        <DialogFooter>
          <button className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary" onClick={() => setSelectedApproval(null)}>Cancel</button>
          <button 
            className={`px-4 py-2 rounded text-sm font-medium ${actionType === 'APPROVED' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
            onClick={submitAction}
          >
            Confirm {actionType}
          </button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
