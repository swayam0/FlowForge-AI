export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { SettingsRepository } from '@/repositories/SettingsRepository';
import { encryptionHelper } from '@/server/helpers/encryptionHelper';
import { successResponse, errorResponse } from '../responseHelper';

const settingsRepo = new SettingsRepository();

export async function GET() {
  try {
    let geminiKey = '';
    
    try {
      geminiKey = (await settingsRepo.getSetting('geminiApiKey')) || '';
    } catch (dbError: any) {
      console.warn('Warning: Database connection failed. Falling back to environment variables.');
    }
    
    // Check if configured via DB or fallback env variables
    const geminiConfigured = !!geminiKey || !!process.env.GEMINI_API_KEY;

    return successResponse({
      geminiConfigured,
      geminiMasked: encryptionHelper.maskApiKey(geminiKey || process.env.GEMINI_API_KEY || ''),
    });
  } catch (error: any) {
    return errorResponse(error.message, undefined, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, key } = body;

    if (!provider || !['gemini'].includes(provider)) {
      return errorResponse('Invalid provider', undefined, 400);
    }

    if (!key || typeof key !== 'string' || key.trim() === '') {
      return errorResponse('API key is required', undefined, 400);
    }

    const dbKey = 'geminiApiKey';
    await settingsRepo.setSetting(dbKey, key.trim());

    return successResponse({ message: 'API key saved successfully' });
  } catch (error: any) {
    return errorResponse(error.message, undefined, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as string;

    if (!provider || !['gemini'].includes(provider)) {
      return errorResponse('Invalid provider', undefined, 400);
    }

    const dbKey = 'geminiApiKey';
    await settingsRepo.deleteSetting(dbKey);

    return successResponse({ message: 'API key removed successfully' });
  } catch (error: any) {
    return errorResponse(error.message, undefined, 500);
  }
}
