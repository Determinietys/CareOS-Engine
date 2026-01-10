import crypto from 'crypto';

/**
 * Decrypt phone number from BusinessOS (or other partners)
 * Uses RSA-OAEP padding for secure phone number transfer
 */
export function decrypt(encryptedData: string, privateKey: string): string {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt phone number for sending to CareOS (or other partners)
 * Uses RSA-OAEP padding for secure phone number transfer
 */
export function encrypt(phone: string, publicKey: string): string {
  try {
    const buffer = Buffer.from(phone, 'utf8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return encrypted.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Hash phone number for deduplication (both platforms)
 * Uses SHA-256 with salt to prevent rainbow table attacks
 */
export function hashPhone(phone: string, salt?: string): string {
  const hashSalt = salt || process.env.PHONE_HASH_SALT || 'default-salt-change-in-production';
  return crypto
    .createHash('sha256')
    .update(phone + hashSalt)
    .digest('hex');
}

/**
 * Generate RSA key pair for partner integrations
 * Run this once to generate keys for each partner integration
 */
export function generateKeyPair(): {
  publicKey: string;
  privateKey: string;
} {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return {
    publicKey,
    privateKey,
  };
}

