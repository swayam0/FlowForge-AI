import { CreateWorkflowSchema } from './src/validators/workflow.schema.ts';

const payload = {
  name: 'New Workflow',
  description: '',
  nodes: [{
    id: 'node-1',
    type: 'FINAL_REPORT',
    label: 'FINAL REPORT',
    configuration: {},
    position: { x: 250, y: 150 }
  }],
  edges: []
};

try {
  CreateWorkflowSchema.parse(payload);
  console.log('success');
} catch(e: any) {
  console.log(JSON.stringify(e.issues, null, 2));
}
