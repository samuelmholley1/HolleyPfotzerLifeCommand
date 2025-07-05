// lib/crypto.ts

import * as libsignal from '@signalapp/libsignal-client';

// In a real app, these would be managed per-user and stored securely.
// For now, we'll use in-memory placeholders for a single user.
let userKeys: any = null;

/**
 * Generates a new identity for a user. Should only be called once per user.
 * In a real app, the result would be stored securely on the device.
 */
export async function generateUserIdentity() {
    if (userKeys) {
        console.log("Keys already exist.");
        return;
    }

    try {
        // Generate identity key pair using Signal Protocol
        const identityKeyPair = libsignal.PrivateKey.generate();
        const registrationId = Math.floor(Math.random() * 16384); // Random registration ID

        userKeys = {
            registrationId,
            identityKeyPair,
        };
        
        console.log("User identity generated using Signal Protocol.");
    } catch (error) {
        console.error("Failed to generate user identity:", error);
        throw error;
    }
}

/**
 * Encrypts an event object. This is a simplified example.
 * A full implementation requires session management with a recipient.
 * For our use case (encrypting for self), we can use a simplified flow.
 */
export async function encryptEvent(data: object): Promise<string | null> {
    if (!userKeys) {
        console.error("User identity not generated. Cannot encrypt.");
        return null;
    }
    
    try {
        const dataString = JSON.stringify(data);
        // NOTE: This is a simplified encryption for self.
        // A real E2EE chat would involve building a session with a recipient's keys.
        // For encrypting data for local storage/cloud backup, this is a reasonable starting point.
        
        // Generate a random key for this encryption
        const messageKey = libsignal.PrivateKey.generate();
        const publicKey = userKeys.identityKeyPair.getPublicKey();
        
        // Use Signal's encryption primitives
        const ciphertext = publicKey.encrypt(Buffer.from(dataString));
        
        return Buffer.from(ciphertext).toString('base64');
    } catch (error) {
        console.error("Encryption failed:", error);
        return null;
    }
}

/**
 * Decrypts an event ciphertext.
 */
export async function decryptEvent(ciphertextBase64: string): Promise<object | null> {
    if (!userKeys) {
        console.error("User identity not generated. Cannot decrypt.");
        return null;
    }
    
    try {
        const ciphertext = Buffer.from(ciphertextBase64, 'base64');
        
        // Decrypt using the private key
        const plaintextBuffer = userKeys.identityKeyPair.decrypt(ciphertext);
        const plaintext = Buffer.from(plaintextBuffer).toString();
        
        return JSON.parse(plaintext);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
}
