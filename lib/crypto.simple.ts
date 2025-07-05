// lib/crypto.simple.ts

// Simplified crypto implementation for browser compatibility
// This is NOT production-ready and should be replaced with proper Signal Protocol
// when we can resolve the browser compatibility issues

let cryptoKey: CryptoKey | null = null;

/**
 * Initialize crypto with a simple AES key
 */
export async function generateUserIdentity(): Promise<void> {
    if (cryptoKey) {
        console.log("Crypto key already exists.");
        return;
    }

    try {
        // Generate a simple AES-GCM key
        cryptoKey = await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        );
        
        console.log("Simple crypto key generated (NOT Signal Protocol).");
    } catch (error) {
        console.error("Failed to generate crypto key:", error);
        throw error;
    }
}

/**
 * Encrypt an event object using AES-GCM
 */
export async function encryptEvent(data: object): Promise<string | null> {
    if (!cryptoKey) {
        console.error("Crypto key not generated. Cannot encrypt.");
        return null;
    }
    
    try {
        const dataString = JSON.stringify(data);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataString);
        
        // Generate a random IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt the data
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            cryptoKey,
            dataBuffer
        );
        
        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);
        
        // Return as base64
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error("Encryption failed:", error);
        return null;
    }
}

/**
 * Decrypt an event ciphertext using AES-GCM
 */
export async function decryptEvent(ciphertextBase64: string): Promise<object | null> {
    if (!cryptoKey) {
        console.error("Crypto key not generated. Cannot decrypt.");
        return null;
    }
    
    try {
        // Decode from base64
        const combined = new Uint8Array(
            atob(ciphertextBase64)
                .split('')
                .map(char => char.charCodeAt(0))
        );
        
        // Extract IV and encrypted data
        const iv = combined.slice(0, 12);
        const encryptedData = combined.slice(12);
        
        // Decrypt the data
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            cryptoKey,
            encryptedData
        );
        
        // Convert back to string and parse JSON
        const decoder = new TextDecoder();
        const plaintext = decoder.decode(decryptedBuffer);
        
        return JSON.parse(plaintext);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
}
