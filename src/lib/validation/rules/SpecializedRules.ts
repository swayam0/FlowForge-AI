import { ValidationRule, ValidationIssue, WorkflowContext } from '../types';
import { WorkflowStepType } from '@/types/common';

export const aiSafetyRule: ValidationRule = {
  id: 'special-ai-safety',
  category: 'AI',
  description: 'Validates AI prompts for size limits and configuration.',
  evaluate: (workflow: WorkflowContext): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    for (const node of workflow.nodes) {
      if (node.type === WorkflowStepType.AI_EXTRACTION || node.type === WorkflowStepType.AI_CLASSIFICATION) {
        const config = node.configuration || {};
        const prompt = typeof config.prompt === 'string' ? config.prompt : '';

        if (prompt.length > 10000) {
          issues.push({
            id: `ai-prompt-length-${node.id}`,
            categoryId: 'AI',
            title: 'Extremely Large Prompt',
            description: `Node "${node.label}" has a prompt that is over 10,000 characters. This may cause context window limits or timeouts.`,
            nodeId: node.id,
            severity: 'WARNING',
            suggestedFix: 'Consider breaking down the task into multiple AI nodes or using Retrieval Augmented Generation (RAG).'
          });
        }
      }
    }
    return issues;
  }
};

export const securityPermissionsRule: ValidationRule = {
  id: 'special-security-permissions',
  category: 'Security',
  description: 'Validates permissions are correctly assigned.',
  evaluate: (workflow: WorkflowContext): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    for (const node of workflow.nodes) {
      if (node.type === WorkflowStepType.HUMAN_APPROVAL) {
        if (!node.permissions || node.permissions.length === 0) {
          issues.push({
            id: `sec-approval-perms-${node.id}`,
            categoryId: 'Security',
            title: 'Unsecured Approval',
            description: `Node "${node.label}" does not have explicitly restricted permissions. Anyone might be able to approve it.`,
            nodeId: node.id,
            severity: 'WARNING',
            suggestedFix: 'Assign specific roles or users in the permission settings.'
          });
        }
      }
    }
    return issues;
  }
};

export const executionConfigRule: ValidationRule = {
  id: 'special-execution-config',
  category: 'Execution',
  description: 'Validates execution parameters like retry policies.',
  evaluate: (workflow: WorkflowContext): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    for (const node of workflow.nodes) {
      if (node.type === WorkflowStepType.MOCK_EXTERNAL_ACTION) {
        const config = node.configuration || {};
        if (!config.retryPolicy) {
          issues.push({
            id: `exec-retry-${node.id}`,
            categoryId: 'Execution',
            title: 'Missing Retry Policy',
            description: `Node "${node.label}" calls an external service but has no retry policy configured.`,
            nodeId: node.id,
            severity: 'INFO',
            suggestedFix: 'Configure a retry policy to handle transient network errors.'
          });
        }
      }
    }
    return issues;
  }
};
