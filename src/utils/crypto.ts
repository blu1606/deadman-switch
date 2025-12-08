/**
 * Client-side AES-GCM encryption using Web Crypto API
 * Zero-Knowledge: plaintext never leaves the browser
 */

// Types for encrypted data
export interface EncryptedData {
    ciphertext: string; // base64
    iv: string; // base64
}

export interface WrappedKeyData {
    wrappedKey: string; // base64
    salt: string; // base64
    iv: string; // base64
}

// Wallet-mode key data (no password needed)
export interface WalletKeyData {
    wrappedKey: string; // base64
    iv: string; // base64
    recipientPubkey: string; // base58
    vaultSeed: string; // string representation of seed
}

export interface EncryptedVaultData {
    encryptedFile: EncryptedData;
    keyWrapper?: WrappedKeyData; // Password-protected key (mode: password)
    walletKey?: WalletKeyData; // Wallet-derived key (mode: wallet)
    mode: 'password' | 'wallet';
    originalFileName: string;
    originalFileType: string;
}

/**
 * Generate a random AES-256 key
 */
export async function generateAESKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true, // extractable
        ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
}

/**
 * Generate AES key from wallet signature (deterministic)
 * Uses SHA-256 hash of signature as key material
 */
export async function generateKeyFromSignature(
    signature: Uint8Array
): Promise<CryptoKey> {
    // Hash the signature to get 256-bit key material
    const keyMaterial = await crypto.subtle.digest(
        'SHA-256',
        signature.buffer as ArrayBuffer
    );

    // Import as AES key
    return await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
}

/**
 * Export CryptoKey to base64 string for storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
    const rawKey = await crypto.subtle.exportKey('raw', key);
    return arrayBufferToBase64(rawKey);
}

/**
 * Import base64 string back to CryptoKey
 */
export async function importKey(keyBase64: string): Promise<CryptoKey> {
    const rawKey = base64ToArrayBuffer(keyBase64);
    return await crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
}

// ============================================================================
// PBKDF2 KEY WRAPPING
// ============================================================================

/**
 * Derive a wrapper key from password using PBKDF2
 */
async function deriveWrapperKey(
    password: string,
    salt: Uint8Array
): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password).buffer as ArrayBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt.buffer as ArrayBuffer,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['wrapKey', 'unwrapKey']
    );
}

/**
 * Wrap (encrypt) the vault key with a password
 */
export async function wrapKeyWithPassword(
    vaultKey: CryptoKey,
    password: string
): Promise<WrappedKeyData> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const wrapperKey = await deriveWrapperKey(password, salt);

    const wrappedKeyBuffer = await crypto.subtle.wrapKey(
        'raw',
        vaultKey,
        wrapperKey,
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }
    );

    return {
        wrappedKey: arrayBufferToBase64(wrappedKeyBuffer),
        salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    };
}

/**
 * Unwrap (decrypt) the vault key using password
 */
export async function unwrapKeyWithPassword(
    wrappedData: WrappedKeyData,
    password: string
): Promise<CryptoKey> {
    const salt = base64ToArrayBuffer(wrappedData.salt);
    const iv = base64ToArrayBuffer(wrappedData.iv);
    const wrappedKey = base64ToArrayBuffer(wrappedData.wrappedKey);

    const wrapperKey = await deriveWrapperKey(
        password,
        new Uint8Array(salt)
    );

    return await crypto.subtle.unwrapKey(
        'raw',
        wrappedKey,
        wrapperKey,
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}


// ============================================================================
// ENCRYPTION FUNCTIONS
// ============================================================================

/**
 * Encrypt a file using AES-GCM
 */
export async function encryptFile(
    file: File,
    key: CryptoKey
): Promise<EncryptedData> {
    const fileBuffer = await file.arrayBuffer();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv.buffer as ArrayBuffer,
        },
        key,
        fileBuffer
    );

    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    };
}

/**
 * Decrypt data back to original Blob
 */
export async function decryptFile(
    encryptedData: EncryptedData,
    key: CryptoKey
): Promise<Blob> {
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
    const iv = base64ToArrayBuffer(encryptedData.iv);

    const plaintext = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: new Uint8Array(iv),
        },
        key,
        ciphertext
    );

    return new Blob([plaintext]);
}

/**
 * Create encrypted package with PASSWORD PROTECTION
 */
export async function createPasswordProtectedVaultPackage(
    file: File,
    password: string
): Promise<{ blob: Blob }> {
    // 1. Generate random vault key
    const vaultKey = await generateAESKey();

    // 2. Encrypt file with vault key
    const encryptedFile = await encryptFile(file, vaultKey);

    // 3. Wrap vault key with password
    const keyWrapper = await wrapKeyWithPassword(vaultKey, password);

    // 4. Create metadata
    const metadata = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        encryptedAt: new Date().toISOString(),
    };

    // 5. Package everything
    const package_ = {
        version: 2,
        metadata,
        encryptedFile,
        keyWrapper, // Replaces raw key export
    };

    const blob = new Blob([JSON.stringify(package_)], {
        type: 'application/json',
    });

    return { blob };
}

// ============================================================================
// WALLET-MODE ENCRYPTION (No password required)
// ============================================================================

/**
 * Derive deterministic key from recipient pubkey + vault seed.
 * This allows encryption that only the correct recipient wallet can decrypt.
 */
export async function deriveRecipientKey(
    recipientPubkey: string,
    vaultSeed: string
): Promise<CryptoKey> {
    const combined = `DEADMAN_SWITCH_V1:${recipientPubkey}:${vaultSeed}`;
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.digest(
        'SHA-256',
        encoder.encode(combined).buffer as ArrayBuffer
    );

    return await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['wrapKey', 'unwrapKey']
    );
}

/**
 * Wrap AES key using wallet-derived key
 */
export async function wrapKeyWithWallet(
    vaultKey: CryptoKey,
    recipientPubkey: string,
    vaultSeed: string
): Promise<WalletKeyData> {
    const wrapperKey = await deriveRecipientKey(recipientPubkey, vaultSeed);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const wrappedKeyBuffer = await crypto.subtle.wrapKey(
        'raw',
        vaultKey,
        wrapperKey,
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }
    );

    return {
        wrappedKey: arrayBufferToBase64(wrappedKeyBuffer),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
        recipientPubkey,
        vaultSeed,
    };
}

/**
 * Unwrap AES key using connected wallet's pubkey
 */
export async function unwrapKeyWithWallet(
    walletKey: WalletKeyData,
    connectedPubkey: string
): Promise<CryptoKey> {
    // Verify the connected wallet matches the recipient
    if (connectedPubkey !== walletKey.recipientPubkey) {
        throw new Error('Connected wallet does not match vault recipient');
    }

    const wrapperKey = await deriveRecipientKey(
        walletKey.recipientPubkey,
        walletKey.vaultSeed
    );

    const iv = base64ToArrayBuffer(walletKey.iv);
    const wrappedKey = base64ToArrayBuffer(walletKey.wrappedKey);

    return await crypto.subtle.unwrapKey(
        'raw',
        wrappedKey,
        wrapperKey,
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Create vault package with WALLET-mode encryption (no password)
 */
export async function createWalletProtectedVaultPackage(
    file: File,
    recipientPubkey: string,
    vaultSeed: string
): Promise<{ blob: Blob }> {
    // 1. Generate random vault key
    const vaultKey = await generateAESKey();

    // 2. Encrypt file with vault key
    const encryptedFile = await encryptFile(file, vaultKey);

    // 3. Wrap vault key with wallet-derived key
    const walletKey = await wrapKeyWithWallet(vaultKey, recipientPubkey, vaultSeed);

    // 4. Create metadata
    const metadata = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        encryptedAt: new Date().toISOString(),
    };

    // 5. Package everything
    const package_ = {
        version: 3, // New version for wallet mode
        mode: 'wallet',
        metadata,
        encryptedFile,
        walletKey,
    };

    const blob = new Blob([JSON.stringify(package_)], {
        type: 'application/json',
    });

    return { blob };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
