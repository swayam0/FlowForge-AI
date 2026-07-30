import { ValidationRule, WorkflowContext, ValidationResult, ValidationCategory, ValidationSeverity } from './types';
import { missingTriggerRule, disconnectedNodeRule, cycleDetectionRule, terminalNodeRule } from './rules/GraphRules';
import { nodeConfigRule } from './rules/ConfigRules';
import { variableReferenceRule } from './rules/DataFlowRules';
import { aiSafetyRule, securityPermissionsRule, executionConfigRule } from './rules/SpecializedRules';

class ValidationRegistry {
  private rules: ValidationRule[] = [];

  register(rule: ValidationRule) {
    this.rules.push(rule);
  }

  getRules(): ValidationRule[] {
    return this.rules;
  }

  clear() {
    this.rules = [];
  }
}

export const validationRegistry = new ValidationRegistry();

// Auto-register default rules
validationRegistry.register(missingTriggerRule);
validationRegistry.register(disconnectedNodeRule);
validationRegistry.register(cycleDetectionRule);
validationRegistry.register(terminalNodeRule);
validationRegistry.register(nodeConfigRule);
validationRegistry.register(variableReferenceRule);
validationRegistry.register(aiSafetyRule);
validationRegistry.register(securityPermissionsRule);
validationRegistry.register(executionConfigRule);

export class ValidationEngine {
  // Define max scores for categories
  private maxScores: Record<ValidationCategory, number> = {
    Graph: 25,
    Configuration: 25,
    DataFlow: 25,
    Security: 10,
    AI: 10,
    Execution: 5
  };

  validate(workflow: WorkflowContext): ValidationResult {
    const rules = validationRegistry.getRules();
    const issues = rules.flatMap(rule => rule.evaluate(workflow));

    // Calculate score deductions
    // ERROR = -5, WARNING = -2
    const deductions: Record<ValidationCategory, number> = {
      Graph: 0, Configuration: 0, DataFlow: 0, Security: 0, AI: 0, Execution: 0
    };

    let hasErrors = false;

    issues.forEach(issue => {
      if (issue.severity === 'ERROR') {
        deductions[issue.categoryId] += 5;
        hasErrors = true;
      } else if (issue.severity === 'WARNING') {
        deductions[issue.categoryId] += 2;
      }
    });

    let totalScore = 0;
    const breakdown = {} as Record<ValidationCategory, { score: number; maxScore: number }>;

    for (const category of Object.keys(this.maxScores) as ValidationCategory[]) {
      const max = this.maxScores[category];
      const score = Math.max(0, max - deductions[category]);
      breakdown[category] = { score, maxScore: max };
      totalScore += score;
    }

    return {
      score: totalScore,
      isValid: !hasErrors,
      breakdown,
      issues
    };
  }
}
