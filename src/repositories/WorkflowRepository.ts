import { WorkflowModel, IWorkflow } from '../models/Workflow';
import { WorkflowVersionModel } from '../models/WorkflowVersion';
import { CreateWorkflowSchema, UpdateWorkflowSchema } from '../validators/workflow.schema';
import { z } from 'zod';

export class WorkflowRepository {
  async getById(id: string): Promise<IWorkflow | null> {
    return WorkflowModel.findById(id).exec();
  }

  async create(data: z.infer<typeof CreateWorkflowSchema>, createdBy: string): Promise<IWorkflow> {
    const parsedData = CreateWorkflowSchema.parse(data);
    const workflow = new WorkflowModel({ ...parsedData, createdBy, version: 1 });
    await workflow.save();
    
    await WorkflowVersionModel.create({
      workflowId: workflow._id,
      versionNumber: 1,
      snapshot: workflow.toObject(),
    });

    return workflow;
  }

  async update(id: string, data: z.infer<typeof UpdateWorkflowSchema>): Promise<IWorkflow | null> {
    const parsedData = UpdateWorkflowSchema.parse(data);
    const workflow = await WorkflowModel.findByIdAndUpdate(
      id, 
      { $set: parsedData, $inc: { version: 1 } }, 
      { returnDocument: 'after' }
    ).exec();

    if (workflow) {
      await WorkflowVersionModel.create({
        workflowId: workflow._id,
        versionNumber: workflow.version,
        snapshot: workflow.toObject(),
      });
    }

    return workflow;
  }

  async delete(id: string): Promise<boolean> {
    const result = await WorkflowModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
  
  async list(skip = 0, limit = 20): Promise<any[]> {
    const workflows = await WorkflowModel.find().skip(skip).limit(limit).exec();
    return workflows.map(w => w.toJSON());
  }
}
