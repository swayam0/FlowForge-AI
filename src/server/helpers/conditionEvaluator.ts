export type ConditionOperator = 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';

export function evaluateCondition(actualValue: any, operator: ConditionOperator, expectedValue: any): boolean {
  switch (operator) {
    case 'equals':
      return actualValue === expectedValue;
    case 'notEquals':
      return actualValue !== expectedValue;
    case 'greaterThan':
      return Number(actualValue) > Number(expectedValue);
    case 'lessThan':
      return Number(actualValue) < Number(expectedValue);
    case 'contains':
      if (Array.isArray(actualValue) || typeof actualValue === 'string') {
        return actualValue.includes(expectedValue);
      }
      return false;
    default:
      return false;
  }
}

export function getValueFromOutputs(outputs: Record<string, any>, path: string): any {
  // Path could be "nodeId.field.subfield"
  const keys = path.split('.');
  let current = outputs;
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}
