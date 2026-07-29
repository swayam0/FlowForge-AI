const BASE_URL = '/api';

async function fetcher(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!data.success) {
    console.error('[API Fetcher Error]', data);
    const errorDetails = data.errors && data.errors.length > 0 ? ': ' + JSON.stringify(data.errors) : '';
    throw new Error((data.message || 'API Request Failed') + errorDetails);
  }
  return data.data;
}

export const api = {
  getWorkflows: () => fetcher('/workflows'),
  getWorkflow: (id: string) => fetcher(`/workflows/${id}`),
  getWorkflowVersions: (id: string) => fetcher(`/workflows/${id}/versions`),
  createWorkflow: (data: any) => fetcher('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkflow: (id: string, data: any) => fetcher(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorkflow: (id: string) => fetcher(`/workflows/${id}`, { method: 'DELETE' }),
  
  executeWorkflow: (workflowVersionId: string, input: any = {}) => fetcher(`/runs`, { method: 'POST', body: JSON.stringify({ workflowVersionId, input }) }),
  getExecution: (id: string) => fetcher(`/runs/${id}`),
  getExecutionLogs: (id: string) => fetcher(`/runs/${id}/logs`),
  resumeExecution: (id: string) => fetcher(`/runs/${id}/resume`, { method: 'POST' }),
  cancelExecution: (id: string) => fetcher(`/runs/${id}/cancel`, { method: 'POST' }),
  retryExecution: (id: string) => fetcher(`/runs/${id}/retry`, { method: 'POST' }),
  
  getHistory: () => fetcher('/history'),
  rerunExecution: (id: string, input?: any) => fetcher(`/history/${id}/rerun`, { method: 'POST', body: JSON.stringify({ input }) }),
  
  submitApproval: (id: string, data: any) => fetcher(`/approvals/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  
  getSettings: () => fetcher('/settings'),
  saveSetting: (provider: string, key: string) => fetcher('/settings', { method: 'POST', body: JSON.stringify({ provider, key }) }),
  deleteSetting: (provider: string) => fetcher(`/settings?provider=${provider}`, { method: 'DELETE' }),
};
