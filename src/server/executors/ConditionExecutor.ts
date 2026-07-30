import { ExecutionContext } from '../interfaces/ExecutionContext';
import { ExecutionResult } from '../interfaces/ExecutionResult';
import { WorkflowStepExecutor } from '../interfaces/WorkflowStepExecutor';
import { ConditionOperator, evaluateCondition, getValueFromOutputs } from '../helpers/conditionEvaluator';

export class ConditionExecutor implements WorkflowStepExecutor {
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const config = context.currentNode.configuration;
    
    if (!config || !config.field || !config.operator) {
      return {
        status: 'FAILED',
        output: {},
        reason: 'Condition configuration is missing field or operator.',
      };
    }

    const { field, operator, value } = config as { field: string; operator: ConditionOperator; value: any };
    
    // Evaluate based on previous outputs
    const actualValue = getValueFromOutputs(context.previousOutputs, field);
    const isTrue = evaluateCondition(actualValue, operator, value);

    // Look at edges to determine the next node based on condition result
    // Edge condition could be stored as { result: true/false }
    const edgesFromHere = context.workflow.edges.filter(e => e.source === context.currentNode.id);
    const expectedLabel = isTrue ? 'TRUE' : 'FALSE';
    const expectedHandle = isTrue ? 'true' : 'false';
    const targetEdge = edgesFromHere.find(e => e.label === expectedLabel || e.sourceHandle === expectedHandle || (e.condition && e.condition.result === isTrue));
    const nextNodeId = targetEdge ? targetEdge.target : undefined;

    return {
      status: 'SUCCESS',
      output: {
        evaluatedExpression: `${field} ${operator} ${value}`,
        actualValue,
        selectedBranch: isTrue,
        explanation: `Evaluated ${actualValue} ${operator} ${value} which resulted in ${isTrue}`,
      },
      nextNodeId,
      reason: `Condition field '${field}' evaluated '${isTrue}', routed to branch ${isTrue ? 'True' : 'False'}`,
    };
  }
}
