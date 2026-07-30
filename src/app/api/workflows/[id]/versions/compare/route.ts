import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../../../../responseHelper';
import connectToDatabase from '../../../../../../utils/db';
import { WorkflowVersionModel } from '../../../../../../models/WorkflowVersion';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    const url = new URL(request.url);
    const v1Str = url.searchParams.get('v1');
    const v2Str = url.searchParams.get('v2');

    if (!v1Str || !v2Str) {
      return errorResponse('Both v1 and v2 query parameters are required', null, 400);
    }

    const v1Num = parseInt(v1Str, 10);
    const v2Num = parseInt(v2Str, 10);

    const [version1, version2] = await Promise.all([
      WorkflowVersionModel.findOne({ workflowId: params.id, versionNumber: v1Num }).lean().exec(),
      WorkflowVersionModel.findOne({ workflowId: params.id, versionNumber: v2Num }).lean().exec()
    ]);

    if (!version1) return errorResponse(`Version ${v1Num} not found`, null, 404);
    if (!version2) return errorResponse(`Version ${v2Num} not found`, null, 404);

    const snap1 = version1.snapshot as any;
    const snap2 = version2.snapshot as any;

    const diff = {
      nodes: {
        added: [] as any[],
        deleted: [] as any[],
        modified: [] as any[],
      },
      edges: {
        added: [] as any[],
        deleted: [] as any[],
        modified: [] as any[],
      }
    };

    // Compare nodes
    const nodes1 = new Map((snap1.nodes || []).map((n: any) => [n.id, n]));
    const nodes2 = new Map((snap2.nodes || []).map((n: any) => [n.id, n]));

    for (const [id, n2] of nodes2) {
      if (!nodes1.has(id)) {
        diff.nodes.added.push(n2);
      } else {
        const n1 = nodes1.get(id);
        const configChanged = JSON.stringify(n1.configuration) !== JSON.stringify(n2.configuration);
        const labelChanged = n1.label !== n2.label;
        const typeChanged = n1.type !== n2.type;
        
        if (configChanged || labelChanged || typeChanged) {
          diff.nodes.modified.push({
            id,
            before: { label: n1.label, type: n1.type, configuration: n1.configuration },
            after: { label: n2.label, type: n2.type, configuration: n2.configuration },
            changes: { configChanged, labelChanged, typeChanged }
          });
        }
      }
    }
    for (const [id, n1] of nodes1) {
      if (!nodes2.has(id)) {
        diff.nodes.deleted.push(n1);
      }
    }

    // Compare edges
    const edges1 = new Map((snap1.edges || []).map((e: any) => [e.id, e]));
    const edges2 = new Map((snap2.edges || []).map((e: any) => [e.id, e]));

    for (const [id, e2] of edges2) {
      if (!edges1.has(id)) {
        diff.edges.added.push(e2);
      } else {
        const e1 = edges1.get(id);
        const sourceChanged = e1.source !== e2.source;
        const targetChanged = e1.target !== e2.target;
        const labelChanged = e1.label !== e2.label;
        
        if (sourceChanged || targetChanged || labelChanged) {
          diff.edges.modified.push({
            id,
            before: { source: e1.source, target: e1.target, label: e1.label },
            after: { source: e2.source, target: e2.target, label: e2.label },
            changes: { sourceChanged, targetChanged, labelChanged }
          });
        }
      }
    }
    for (const [id, e1] of edges1) {
      if (!edges2.has(id)) {
        diff.edges.deleted.push(e1);
      }
    }

    return successResponse(diff, 'Version comparison generated successfully');
  } catch (error) {
    return errorResponse('Failed to compare versions', error, 500);
  }
}
