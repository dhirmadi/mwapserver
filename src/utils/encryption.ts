import crypto from 'crypto';
import { logError } from './logger.js';

// In a production environment, these should be loaded from environment variables
// or a secure key management system like AWS KMS, HashiCorp Vault, etc.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a-secure-32-byte-key-for-aes-256-gcm'; // 32 bytes for AES-256
const ENCRYPTION_IV_LENGTH = 16; // For AES, this is always 16 bytes
const ENCRYPTION_TAG_LENGTH = 16; // For GCM mode, recommended tag length

/**
 * Encrypts sensitive data using AES-256-GCM
 * 
 * @param text - The plaintext to encrypt
 * @returns The encrypted data as a base64 string with IV and auth tag
 */
export function encrypt(text: string): string {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    
    // Create cipher with key, iv, and GCM mode
    const cipher = crypto.createCipheriv(
      'aes-256-gcm', 
      Buffer.from(ENCRYPTION_KEY), 
      iv
    );
    
    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and auth tag - all base64 encoded
    return Buffer.concat([
      iv,
      Buffer.from(encrypted, 'base64'),
      authTag
    ]).toString('base64');
  } catch (error) {
    logError('Encryption failed', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data that was encrypted with the encrypt function
 * 
 * @param encryptedData - The encrypted data as a base64 string
 * @returns The decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  try {
    // Convert the combined data back to a buffer
    const data = Buffer.from(encryptedData, 'base64');
    
    // Extract the IV, encrypted content, and auth tag
    const iv = data.subarray(0, ENCRYPTION_IV_LENGTH);
    const encrypted = data.subarray(
      ENCRYPTION_IV_LENGTH, 
      data.length - ENCRYPTION_TAG_LENGTH
    );
    const authTag = data.subarray(data.length - ENCRYPTION_TAG_LENGTH);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm', 
      Buffer.from(ENCRYPTION_KEY), 
      iv
    );
    
    // Set auth tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    logError('Decryption failed', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Checks if a string is already encrypted
 * This is a simple heuristic and not foolproof
 * 
 * @param text - The text to check
 * @returns True if the text appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
  try {
    // Check if it's a valid base64 string of sufficient length
    const buffer = Buffer.from(text, 'base64');
    return buffer.length > (ENCRYPTION_IV_LENGTH + ENCRYPTION_TAG_LENGTH);
  } catch {
    return false;
  }
}

/**
 * Safely encrypts a string, checking if it's already encrypted first
 * 
 * @param text - The text to encrypt
 * @returns The encrypted string
 */
export function safeEncrypt(text: string): string {
  if (!text || isEncrypted(text)) {
    return text;
  }
  return encrypt(text);
}

/**
 * Safely decrypts a string, checking if it's encrypted first
 * 
 * @param text - The text to decrypt
 * @returns The decrypted string
 */
export function safeDecrypt(text: string): string {
  if (!text || !isEncrypted(text)) {
    return text;
  }
  return decrypt(text);
}