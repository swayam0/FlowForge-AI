'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';
import { Edit2, Play, Plus, Trash2, Activity } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function WorkflowsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.getWorkflows(),
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await api.deleteWorkflow(id);
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
        toast.success('Workflow deleted');
      } catch (err) {
        toast.error('Failed to delete workflow');
      }
    }
  };

  const handleRun = async (id: string) => {
    try {
      await api.executeWorkflow(id);
      toast.success('Execution started');
      router.push(`/executions`);
    } catch (err) {
      toast.error('Failed to start execution');
    }
  };

  return (
    <div className="flex flex-col h-full p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-1">Manage and execute your AI automation flows.</p>
        </div>
        <Link href="/workflows/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 max-w-[1440px] mx-auto w-full space-y-6 animate-pulse">
              <div className="flex justify-between items-center mb-8">
                <div className="h-8 bg-white/5 rounded w-1/4"></div>
                <div className="h-10 bg-white/5 rounded w-32"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <div key={i} className="h-48 bg-white/5 rounded-xl border border-white/5"></div>)}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows?.map((wf: any) => (
                  <TableRow key={wf.id}>
                    <TableCell className="font-medium">{wf.name}</TableCell>
                    <TableCell>v{wf.version}</TableCell>
                    <TableCell>
                      <Badge variant={wf.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {wf.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(wf.createdAt), 'PP')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleRun(wf.id)}>
                          <Play className="w-4 h-4 mr-1" /> Run
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (!wf.id || wf.id === 'undefined') {
                              toast.error("Workflow ID missing");
                              return;
                            }
                            router.push(`/workflows/${wf.id}`);
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => handleDelete(wf.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!workflows || workflows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 border-dashed">
                          <Activity className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="font-semibold text-white mb-1">No workflows found</p>
                        <p className="text-sm mb-4">Create your first automation workflow to get started.</p>
                        <Button onClick={() => router.push('/workflows/create')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Workflow
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
