export type ConditionOperator = 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';

export function evaluateCondition(actualValue: unknown, operator: ConditionOperator, expectedValue: unknown): boolean {
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
      if (Array.isArray(actualValue)) {
        return actualValue.includes(expectedValue);
      }
      if (typeof actualValue === 'string' && typeof expectedValue === 'string') {
        return actualValue.includes(expectedValue);
      }
      return false;
    default:
      return false;
  }
}

export function getValueFromOutputs(outputs: Record<string, unknown>, path: string): unknown {
  // Path could be "nodeId.field.subfield"
  const keys = path.split('.');
  let current: unknown = outputs;
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = typeof current === 'object' && current !== null ? (current as Record<string, unknown>)[key] : undefined;
  }
  return current;
}
