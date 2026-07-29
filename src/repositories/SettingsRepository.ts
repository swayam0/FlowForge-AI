import { Settings } from '@/models/Settings';
import { encryptionHelper } from '@/server/helpers/encryptionHelper';
import dbConnect from '@/utils/db';

export class SettingsRepository {
  async getSetting(key: string): Promise<string | null> {
    await dbConnect();
    const setting = await Settings.findOne({ key });
    if (!setting) return null;
    
    try {
      return encryptionHelper.decrypt(setting.value);
    } catch (error) {
      console.error(`Failed to decrypt setting for key: ${key}`);
      return null;
    }
  }

  async setSetting(key: string, value: string): Promise<void> {
    await dbConnect();
    const encryptedValue = encryptionHelper.encrypt(value);
    await Settings.findOneAndUpdate(
      { key },
      { value: encryptedValue },
      { upsert: true, returnDocument: 'after' }
    );
  }

  async deleteSetting(key: string): Promise<void> {
    await dbConnect();
    await Settings.deleteOne({ key });
  }
}
