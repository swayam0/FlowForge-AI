import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/settings/route';
import { SettingsRepository } from '@/repositories/SettingsRepository';

vi.mock('@/utils/db', () => ({
  default: vi.fn().mockResolvedValue(true)
}));

describe('API Routes: Settings', () => {
  let settingsRepo: SettingsRepository;

  beforeEach(async () => {
    settingsRepo = new SettingsRepository();
    await settingsRepo.deleteSetting('geminiApiKey'); // Ensure clean state
  });

  it('GET /api/settings should return settings status', async () => {
    const res = await GET();
    
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.data).toHaveProperty('geminiConfigured');
  });

  it('POST /api/settings should save Gemini API key', async () => {
    const req = new Request('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify({ provider: 'gemini', key: 'AIzaSyTestKey123' })
    });

    const res = await POST(req);
    
    expect(res.status).toBe(200);
    
    const key = await settingsRepo.getSetting('geminiApiKey');
    expect(key).toBe('AIzaSyTestKey123');
  });

  it('DELETE /api/settings should remove Gemini API key', async () => {
    await settingsRepo.setSetting('geminiApiKey', 'AIzaSyTestKey123');

    const req = new Request('http://localhost/api/settings?provider=gemini', {
      method: 'DELETE'
    });
    const res = await DELETE(req);
    
    expect(res.status).toBe(200);
    
    const key = await settingsRepo.getSetting('geminiApiKey');
    expect(key).toBeNull();
  });
});
