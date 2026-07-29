import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Ensure the key is exactly 32 bytes long for aes-256-cbc
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; 

export const encryptionHelper = {
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  },

  decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  },

  maskApiKey(key: string): string {
    if (!key) return '';
    
    // Mask differently based on length to ensure we don't expose too much
    // Gemini keys usually start with 'AIza'
    const prefixLen = key.startsWith('sk-') ? 3 : (key.startsWith('AIza') ? 4 : 4);
    
    // If the key is very short, just mask the middle
    if (key.length <= 12) {
      return key.slice(0, prefixLen) + '****' + key.slice(-4);
    }

    return key.slice(0, prefixLen + 1) + '*'.repeat(12) + key.slice(-4);
  }
};
