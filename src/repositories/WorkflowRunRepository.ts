import { WorkflowRunModel, IWorkflowRun } from '../models/WorkflowRun';
import { StartRunSchema, UpdateRunStatusSchema } from '../validators/run.schema';
import { z } from 'zod';

export class WorkflowRunRepository {
  async getById(id: string): Promise<IWorkflowRun | null> {
    return WorkflowRunModel.findById(id).exec();
  }

  async startRun(data: z.infer<typeof StartRunSchema>): Promise<IWorkflowRun> {
    const parsedData = StartRunSchema.parse(data);
    const run = new WorkflowRunModel(parsedData);
    return run.save();
  }

  async updateStatus(id: string, data: z.infer<typeof UpdateRunStatusSchema>): Promise<IWorkflowRun | null> {
    const parsedData = UpdateRunStatusSchema.parse(data);
    return WorkflowRunModel.findByIdAndUpdate(id, parsedData, { returnDocument: 'after' }).exec();
  }

  async getRunsByWorkflowVersion(workflowVersionId: string, skip: number = 0, limit: number = 20): Promise<IWorkflowRun[]> {
    return WorkflowRunModel.find({ workflowVersionId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  }
}
