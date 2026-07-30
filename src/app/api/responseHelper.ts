import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function successResponse(data: unknown, message: string = 'Success', status: number = 200) {
  return NextResponse.json({
    success: true,
    message,
    data,
  }, { status });
}

export function errorResponse(message: string, error?: unknown, status: number = 400) {
  let code = 'API_ERROR';
  let field: string | undefined = undefined;
  let finalMessage = message;

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    code = 'VALIDATION_ERROR';
    finalMessage = firstIssue ? firstIssue.message : 'Validation failed';
    field = firstIssue && firstIssue.path.length > 0 ? firstIssue.path.join('.') : undefined;
  } else if (error instanceof Error) {
    code = (error as { code?: string }).code || 'INTERNAL_ERROR';
    finalMessage = error.message || message;
  }

  return NextResponse.json({
    success: false,
    error: {
      code,
      message: finalMessage,
      ...(field ? { field } : {})
    }
  }, { status });
}
