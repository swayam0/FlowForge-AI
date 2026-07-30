import { ValidationRule, ValidationIssue, WorkflowContext } from '../types';
import { WorkflowStepType } from '@/types/common';

export const nodeConfigRule: ValidationRule = {
  id: 'config-required-fields',
  category: 'Configuration',
  description: 'Validates that each node has its required configuration fields.',
  evaluate: (workflow: WorkflowContext): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    for (const node of workflow.nodes) {
      const config = node.configuration || {};

      switch (node.type) {
        case WorkflowStepType.AI_EXTRACTION:
        case WorkflowStepType.AI_CLASSIFICATION:
          if (!config.provider) {
            issues.push({
              id: `config-ai-provider-${node.id}`,
              categoryId: 'Configuration',
              title: 'Missing AI Provider',
              description: `Node "${node.label}" must have an AI provider selected.`,
              nodeId: node.id,
              severity: 'ERROR',
              suggestedFix: 'Select a provider (e.g., Google, OpenAI) in the node configuration.'
            });
          }
          if (!config.model) {
            issues.push({
              id: `config-ai-model-${node.id}`,
              categoryId: 'Configuration',
              title: 'Missing AI Model',
              description: `Node "${node.label}" must specify an AI model.`,
              nodeId: node.id,
              severity: 'ERROR',
              suggestedFix: 'Select a model for the provider.'
            });
          }
          if (!config.prompt || typeof config.prompt !== 'string' || config.prompt.trim() === '') {
            issues.push({
              id: `config-ai-prompt-${node.id}`,
              categoryId: 'Configuration',
              title: 'Empty Prompt',
              description: `Node "${node.label}" requires a prompt.`,
              nodeId: node.id,
              severity: 'ERROR',
              suggestedFix: 'Write instructions in the Prompt field.'
            });
          }
          break;

        case WorkflowStepType.DOCUMENT_RETRIEVAL:
          if (!config.query || typeof config.query !== 'string' || config.query.trim() === '') {
            issues.push({
              id: `config-retrieval-query-${node.id}`,
              categoryId: 'Configuration',
              title: 'Missing Search Query',
              description: `Node "${node.label}" requires a query string.`,
              nodeId: node.id,
              severity: 'ERROR',
              suggestedFix: 'Set a query string or variable reference.'
            });
          }
          break;

        case WorkflowStepType.HUMAN_APPROVAL:
          if (!config.reviewer) {
            issues.push({
              id: `config-approval-reviewer-${node.id}`,
              categoryId: 'Configuration',
              title: 'Missing Reviewer',
              description: `Node "${node.label}" must have a designated reviewer.`,
              nodeId: node.id,
              severity: 'ERROR',
              suggestedFix: 'Assign a user or role as the reviewer.'
            });
          }
          break;

        case WorkflowStepType.MOCK_EXTERNAL_ACTION:
          if (!config.endpoint) {
            issues.push({
              id: `config-action-endpoint-${node.id}`,
              categoryId: 'Configuration',
              title: 'Missing Endpoint',
              description: `Node "${node.label}" requires an API endpoint.`,
              nodeId: node.id,
              severity: 'ERROR',
              suggestedFix: 'Provide a valid URL.'
            });
          }
          break;

        case WorkflowStepType.DETERMINISTIC_CONDITION:
          if (!config.expression) {
            issues.push({
              id: `config-condition-expression-${node.id}`,
              categoryId: 'Configuration',
              title: 'Missing Expression',
              description: `Node "${node.label}" needs a condition expression.`,
              nodeId: node.id,
              severity: 'ERROR',
              suggestedFix: 'Define an expression (e.g., input.score > 50).'
            });
          }
          // Validate branches have at least 2 outbound edges
          const outboundEdges = workflow.edges.filter(e => e.source === node.id);
          if (outboundEdges.length < 2) {
            issues.push({
              id: `config-condition-branches-${node.id}`,
              categoryId: 'Configuration',
              title: 'Missing Condition Branches',
              description: `Node "${node.label}" must have at least True and False branches connected.`,
              nodeId: node.id,
              severity: 'WARNING',
              suggestedFix: 'Connect both true and false outputs to subsequent nodes.'
            });
          }
          break;
      }
    }

    return issues;
  }
};
