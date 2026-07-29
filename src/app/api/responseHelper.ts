import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function successResponse(data: any, message: string = 'Success', status: number = 200) {
  return NextResponse.json({
    success: true,
    message,
    data,
  }, { status });
}

export function errorResponse(message: string, error?: any, status: number = 400) {
  let errors: any[] = [];
  
  if (error instanceof ZodError) {
    errors = error.issues;
    message = 'Validation failed: ' + JSON.stringify(error.issues);
  } else if (error instanceof Error) {
    errors = [error.message];
  } else if (error) {
    errors = [error];
  }

  return NextResponse.json({
    success: false,
    message,
    errors,
  }, { status });
}
