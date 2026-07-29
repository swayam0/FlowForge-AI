'use client';

import { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { WorkflowBuilder } from '../../../components/workflow/WorkflowBuilder';
import { ExecutionMonitor } from '../../../components/execution/ExecutionMonitor';
import { VersionComparisonTab } from '../../../components/workflow/VersionComparisonTab';
import { Button } from '../../../components/ui/Button';
import { toast } from 'sonner';

export default function WorkflowDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [activeTab, setActiveTab] = useState<'editor' | 'monitor' | 'versions'>('editor');
  
  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => api.getWorkflow(id),
  });

  const handleExecute = async () => {
    try {
      const result = await api.executeWorkflow(id);
      setActiveTab('monitor');
      toast.success(`Execution started: ${result.executionId}`);
    } catch (err) {
      toast.error('Execution failed to start');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] w-full flex items-center justify-center bg-[#050505] animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
          <div className="h-4 w-32 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }
  if (!workflow) return <div className="p-8">Workflow not found.</div>;

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
          <Button onClick={handleExecute} className="bg-emerald-600 hover:bg-emerald-700">
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
    </div>
  );
}
