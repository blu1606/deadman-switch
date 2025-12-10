'use client';

/**
 * SafetyScanner - Client-side content scanner for sensitive data detection
 * Phase 9.4: Anti-Doxxer (Privacy Guard)
 * 
 * Prevents users from accidentally leaking private keys or seed phrases
 * in unencrypted metadata fields like Vault Name or Note Title.
 */

export type SecretType = 'solana_key' | 'evm_key' | 'seed_phrase' | 'credit_card';

export interface ScanResult {
    detected: boolean;
    type?: SecretType;
    name?: string;
    suggestion?: string;
}

// Regex patterns for detecting sensitive data
const DANGER_PATTERNS: Array<{
    type: SecretType;
    name: string;
    regex: RegExp;
    suggestion: string;
}> = [
        {
            type: 'solana_key',
            name: 'Solana Private Key',
            // Base58 string, 87-88 characters (Solana keypair format)
            regex: /[1-9A-HJ-NP-Za-km-z]{87,88}/,
            suggestion: 'Private keys must be stored in the encrypted vault content, not in the vault name or note title.'
        },
        {
            type: 'evm_key',
            name: 'Ethereum/EVM Private Key',
            // 0x followed by 64 hex characters
            regex: /0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64}/,
            suggestion: 'EVM private keys should never be shared in plain text. Store them securely in the encrypted content.'
        },
        {
            type: 'seed_phrase',
            name: 'Seed Phrase / Mnemonic',
            // 12 or 24 words (3+ chars each) separated by spaces
            // More strict: lowercase words only
            regex: /^([a-z]{3,}\s){11,23}[a-z]{3,}$/i,
            suggestion: 'Seed phrases are the master key to your wallet. Never expose them in unencrypted fields.'
        },
        {
            type: 'credit_card',
            name: 'Credit Card Number',
            // 16 digits with optional spaces/dashes
            regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
            suggestion: 'Credit card numbers should never be stored in plain text.'
        }
    ];

// Common BIP39 seed words for additional validation
const COMMON_BIP39_WORDS = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'academy', 'access', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire',
    'act', 'action', 'actor', 'actual', 'adapt', 'add', 'addict', 'address',
    'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford',
    'afraid', 'again', 'age', 'agent', 'agree', 'ahead', 'aim', 'air',
    'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien', 'all',
    'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
    'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor',
    'ancient', 'anger', 'angle', 'animal', 'ankle', 'announce', 'annual', 'another',
    'answer', 'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology', 'appear',
    'apple', 'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue',
    'arm', 'armed', 'armor', 'army', 'round', 'arrange', 'arrest', 'arrive',
    'arrow', 'art', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset',
    'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude',
    'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn',
    'average', 'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful',
    'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance',
    'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain',
    'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty',
    'because', 'become', 'beef', 'before', 'begin', 'behave', 'behind', 'believe',
    'below', 'belt', 'bench', 'benefit', 'best', 'betray', 'better', 'between',
    'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird', 'birth',
    'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless',
    'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board',
    'boat', 'body', 'boil', 'bomb', 'bone', 'bonus', 'book', 'boost',
    'border', 'boring', 'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy',
    'bracket', 'brain', 'brand', 'brass', 'brave', 'bread', 'breeze', 'brick',
    'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze',
    'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo',
    'build', 'bulb', 'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger',
    'burst', 'bus', 'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage',
    'cabin', 'cable', 'cactus', 'cage', 'cake', 'call', 'calm', 'camera',
    'camp', 'can', 'canal', 'cancel', 'candy', 'cannon', 'canoe', 'canvas',
    'canyon', 'capable', 'capital', 'captain', 'car', 'carbon', 'card', 'cargo',
    'carpet', 'carry', 'cart', 'case', 'cash', 'casino', 'castle', 'casual',
    'cat', 'catalog', 'catch', 'category', 'cattle', 'caught', 'cause', 'caution',
    'cave', 'ceiling', 'celery', 'cement', 'census', 'century', 'cereal', 'certain',
    'chair', 'chalk', 'champion', 'change', 'chaos', 'chapter', 'charge', 'chase',
    'chat', 'cheap', 'check', 'cheese', 'chef', 'cherry', 'chest', 'chicken',
    'chief', 'child', 'chimney', 'choice', 'choose', 'chronic', 'chuckle', 'chunk',
    'churn', 'cigar', 'cinnamon', 'circle', 'citizen', 'city', 'civil', 'claim',
    'clap', 'clarify', 'claw', 'clay', 'clean', 'clerk', 'clever', 'click',
    'client', 'cliff', 'climb', 'clinic', 'clip', 'clock', 'clog', 'close',
    'cloth', 'cloud', 'clown', 'club', 'clump', 'cluster', 'clutch', 'coach',
    'coast', 'coconut', 'code', 'coffee', 'coil', 'coin', 'collect', 'color',
    'column', 'combine', 'come', 'comfort', 'comic', 'common', 'company', 'concert',
    'conduct', 'confirm', 'congress', 'connect', 'consider', 'control', 'convince', 'cook',
    'cool', 'copper', 'copy', 'coral', 'core', 'corn', 'correct', 'cost',
    'cotton', 'couch', 'country', 'couple', 'course', 'cousin', 'cover', 'coyote'
];

/**
 * Enhanced seed phrase detection using BIP39 word matching
 */
function looksLikeSeedPhrase(text: string): boolean {
    const words = text.toLowerCase().trim().split(/\s+/);

    // Must be exactly 12 or 24 words
    if (words.length !== 12 && words.length !== 24) {
        return false;
    }

    // At least 80% of words should be in common BIP39 list
    const bip39Matches = words.filter(word => COMMON_BIP39_WORDS.includes(word));
    const matchRatio = bip39Matches.length / words.length;

    return matchRatio >= 0.8;
}

/**
 * Calculate Shannon entropy of a string
 * High entropy often indicates random data like keys
 */
function calculateEntropy(text: string): number {
    const len = text.length;
    if (len === 0) return 0;

    const freq: Record<string, number> = {};
    for (const char of text) {
        freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    for (const count of Object.values(freq)) {
        const p = count / len;
        entropy -= p * Math.log2(p);
    }

    return entropy;
}

/**
 * Main scanning function - checks text for sensitive data patterns
 */
export function scanForSecrets(text: string): ScanResult {
    if (!text || text.length < 10) {
        return { detected: false };
    }

    const trimmed = text.trim();

    // Check BIP39 seed phrase first (more accurate than regex alone)
    if (looksLikeSeedPhrase(trimmed)) {
        return {
            detected: true,
            type: 'seed_phrase',
            name: 'Seed Phrase / Mnemonic',
            suggestion: 'Seed phrases are the master key to your wallet. Never expose them in unencrypted fields.'
        };
    }

    // Check other patterns
    for (const pattern of DANGER_PATTERNS) {
        if (pattern.regex.test(trimmed)) {
            // For key patterns, also verify high entropy
            if (pattern.type === 'solana_key' || pattern.type === 'evm_key') {
                const entropy = calculateEntropy(trimmed);
                // Keys typically have entropy > 4
                if (entropy < 4) continue;
            }

            return {
                detected: true,
                type: pattern.type,
                name: pattern.name,
                suggestion: pattern.suggestion
            };
        }
    }

    return { detected: false };
}

/**
 * Hook-friendly wrapper for use in React components
 */
export function useSafetyScanner() {
    return {
        scan: scanForSecrets
    };
}
