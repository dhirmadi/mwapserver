import crypto from 'crypto';
import { logError } from './logger.js';

// Encryption key should be stored in environment variables
// For development, we'll use a fixed key, but in production this should be a secure environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a-very-secure-32-byte-encryption-key';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const AUTH_TAG_LENGTH = 16; // For GCM mode

/**
 * Encrypts sensitive data using AES-256-GCM
 * 
 * @param text - The text to encrypt
 * @returns The encrypted text as a base64 string with IV and auth tag
 */
export function encrypt(text: string): string {
  try {
    if (!text) return '';
    
    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY), 
      iv
    );
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted text, and auth tag
    // Format: base64(iv):base64(authTag):base64(encryptedText)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    logError('Encryption failed', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data that was encrypted with the encrypt function
 * 
 * @param encryptedText - The encrypted text (format: base64(iv):base64(authTag):base64(encryptedText))
 * @returns The decrypted text
 */
export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText) return '';
    
    // Split the encrypted text into its components
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encryptedData = parts[2];
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY), 
      iv
    );
    
    // Set the authentication tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logError('Decryption failed', error);
    throw new Error('Failed to decrypt data');
  }
}