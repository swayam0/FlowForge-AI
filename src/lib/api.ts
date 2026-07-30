import { Workflow, Execution, ExecutionLog, Approval, WorkflowVersion, VersionDiff } from '../types';

const BASE_URL = '/api';

async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle HTTP status errors before attempting to parse JSON
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Gemini quota exceeded. Please wait a few moments and try again.');
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error('Permission denied. You do not have the required access rights.');
      }
      if (res.status >= 500) {
        throw new Error('Database or upstream server is currently unavailable. Please try again later.');
      }
      if (res.status === 404) {
        throw new Error('Resource not found or invalid workflow ID.');
      }
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error('Received an invalid response from the server.');
    }

    if (!data.success) {
      console.error('[API Fetcher Error]', JSON.stringify(data, null, 2));
      let message = 'API Request Failed';
      if (data.error && data.error.message) {
        message = data.error.message;
        if (data.error.field) {
          message = `${data.error.field}: ${message}`;
        }
      } else if (data.message) {
        message = data.message;
      }
      
      const messageLower = message.toLowerCase();

      // Transform generic backend messages into actionable ones
      if (messageLower.includes('quota') || messageLower.includes('rate limit')) {
        throw new Error('Gemini quota exceeded. Please wait a few moments and try again.');
      }
      if (messageLower.includes('permission') || messageLower.includes('unauthorized')) {
        throw new Error('Permission denied. You do not have the required access rights.');
      }
      if (messageLower.includes('database') || messageLower.includes('db') || messageLower.includes('connect')) {
        throw new Error('Database is currently unavailable. Please check system status.');
      }
      if (messageLower.includes('not found') || messageLower.includes('invalid id')) {
        throw new Error('Invalid workflow or resource not found. Please check your input.');
      }

      throw new Error(message);
    }
    return data.data as T;
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Network unavailable. Please check your internet connection.');
    }
    throw err;
  }
}

export const api = {
  getWorkflows: () => fetcher<Workflow[]>('/workflows'),
  getWorkflow: (id: string) => fetcher<Workflow>(`/workflows/${id}`),
  getWorkflowVersions: (id: string) => fetcher<WorkflowVersion[]>(`/workflows/${id}/versions`),
  compareWorkflowVersions: (id: string, v1: number, v2: number) => fetcher<VersionDiff>(`/workflows/${id}/versions/compare?v1=${v1}&v2=${v2}`),
  createWorkflow: (data: Partial<Workflow>) => fetcher<Workflow>('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkflow: (id: string, data: Partial<Workflow>) => fetcher<Workflow>(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorkflow: (id: string) => fetcher<{ success: boolean }>(`/workflows/${id}`, { method: 'DELETE' }),
  
  executeWorkflow: (id: string, input: Record<string, unknown> = {}) => fetcher<Execution>(`/workflows/${id}/execute`, { method: 'POST', body: JSON.stringify({ input }) }),
  getExecution: (id: string) => fetcher<Execution>(`/runs/${id}`),
  getExecutionLogs: (id: string) => fetcher<ExecutionLog[]>(`/runs/${id}/logs`),
  resumeExecution: (id: string) => fetcher<Execution>(`/runs/${id}/resume`, { method: 'POST' }),
  cancelExecution: (id: string) => fetcher<Execution>(`/runs/${id}/cancel`, { method: 'POST' }),
  retryExecution: (id: string) => fetcher<Execution>(`/runs/${id}/retry`, { method: 'POST' }),
  
  getHistory: () => fetcher<Execution[]>('/history'),
  rerunExecution: (id: string, input?: Record<string, unknown>) => fetcher<Execution>(`/history/${id}/rerun`, { method: 'POST', body: JSON.stringify({ input }) }),
  
  getApprovals: () => fetcher<Approval[]>('/approvals'),
  submitApproval: (id: string, data: Record<string, unknown>) => fetcher<Approval>(`/approvals/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  
  getSettings: () => fetcher<Record<string, unknown>>('/settings'),
  saveSetting: (provider: string, key: string) => fetcher<{ success: boolean }>('/settings', { method: 'POST', body: JSON.stringify({ provider, key }) }),

  getExplanation: (id: string) => fetcher<import('../types/explanation').ExecutionExplanation>(`/runs/${id}/explanation`),
};
