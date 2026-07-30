'use client';

import { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder';
import { ExecutionMonitor } from '@/components/execution/ExecutionMonitor';
import { VersionComparisonTab } from '@/components/workflow/VersionComparisonTab';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonGraph } from '@/components/skeletons/SkeletonGraph';
import { SkeletonButton } from '@/components/skeletons/SkeletonButton';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function WorkflowDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [activeTab, setActiveTab] = useState<'editor' | 'monitor' | 'versions'>('editor');
  
  const { data: workflow, isLoading, isError } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => api.getWorkflow(id),
  });

  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [runInputJson, setRunInputJson] = useState('{\n  "ticketPriority": "CRITICAL",\n  "subject": "System down"\n}');

  const handleExecute = async () => {
    try {
      let parsedInput = {};
      try {
        parsedInput = runInputJson.trim() ? JSON.parse(runInputJson) : {};
      } catch (e) {
        toast.error('Invalid JSON input format');
        return;
      }
      
      const result = await api.executeWorkflow(id, parsedInput);
      setIsRunModalOpen(false);
      setActiveTab('monitor');
      toast.success(`Execution started: ${result.id}`);
    } catch (err) {
      toast.error('Execution failed to start');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-8 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 bg-white/5" />
            <Skeleton className="h-4 w-40 bg-white/5" />
          </div>
          <div className="flex gap-2 w-full max-w-md justify-end">
            <div className="w-24"><SkeletonButton /></div>
            <div className="w-24"><SkeletonButton /></div>
            <div className="w-24"><SkeletonButton /></div>
            <div className="w-32 ml-2"><SkeletonButton /></div>
          </div>
        </div>
        <div className="flex-1 w-full rounded-xl overflow-hidden border border-white/5">
          <SkeletonGraph />
        </div>
      </div>
    );
  }
  
  if (isError || !workflow) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center bg-card border border-border rounded-xl p-12 shadow-sm max-w-md">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Workflow Not Found</h2>
          <p className="text-muted-foreground mb-6 text-sm">The workflow you are looking for does not exist or there was an error loading it.</p>
          <Link href="/workflows">
            <Button>Back to Workflows</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{workflow.name}</h1>
          <p className="text-muted-foreground mt-1">v{workflow.version} • {workflow.status}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={activeTab === 'editor' ? 'default' : 'outline'} onClick={() => setActiveTab('editor')}>
            Editor
          </Button>
          <Button variant={activeTab === 'versions' ? 'default' : 'outline'} onClick={() => setActiveTab('versions')}>
            Versions
          </Button>
          <Button variant={activeTab === 'monitor' ? 'default' : 'outline'} onClick={() => setActiveTab('monitor')}>
            Monitor
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button onClick={() => setIsRunModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            Run Workflow
          </Button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <WorkflowBuilder initialWorkflow={workflow} />
      ) : activeTab === 'versions' ? (
        <VersionComparisonTab workflowId={workflow.id} />
      ) : (
        <ExecutionMonitor workflowId={workflow.id} />
      )}

      {/* Run Modal */}
      <Dialog open={isRunModalOpen} onOpenChange={setIsRunModalOpen}>
        <DialogHeader>
          <DialogTitle>Run Workflow</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">Initial Input (JSON)</label>
          <textarea
            className="w-full h-32 bg-[#0a0a0a] border border-[#27272a] rounded-lg p-3 text-sm font-mono focus:border-blue-500 focus:outline-none"
            value={runInputJson}
            onChange={(e) => setRunInputJson(e.target.value)}
            placeholder="{}"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsRunModalOpen(false)}>Cancel</Button>
          <Button onClick={handleExecute} className="bg-emerald-600 hover:bg-emerald-700">Start Execution</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
