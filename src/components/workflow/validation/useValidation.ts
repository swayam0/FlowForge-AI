'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkflowBuilderStore } from '@/lib/store';
import { ValidationEngine } from '@/lib/validation/ValidationEngine';
import { ValidationResult } from '@/lib/validation/types';

const engine = new ValidationEngine();

export function useValidation() {
  const { nodes, edges } = useWorkflowBuilderStore();
  
  const [result, setResult] = useState<ValidationResult>({
    score: 100,
    isValid: true,
    breakdown: {
      Graph: { score: 25, maxScore: 25 },
      Configuration: { score: 25, maxScore: 25 },
      DataFlow: { score: 25, maxScore: 25 },
      Security: { score: 10, maxScore: 10 },
      AI: { score: 10, maxScore: 10 },
      Execution: { score: 5, maxScore: 5 },
    },
    issues: []
  });

  const [isValidating, setIsValidating] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced validation on workflow change
  useEffect(() => {
    setIsValidating(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      const res = engine.validate({ nodes, edges });
      setResult(res);
      setIsValidating(false);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [nodes, edges]);

  const forceValidate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const res = engine.validate({ nodes, edges });
    setResult(res);
    setIsValidating(false);
    return res;
  }, [nodes, edges]);

  return {
    result,
    isValidating,
    panelOpen,
    setPanelOpen,
    forceValidate
  };
}
