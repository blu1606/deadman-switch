
export const KIP_MESSAGES = {
    IDLE: [
        "Hello! I'm Kip. Ready to see how your digital legacy works?",
        "I'm here to ensure your secrets outlive you.",
        "Your digital guardian is online and waiting.",
        "Let's secure your legacy, shall we?",
    ],
    CLAIMING: [
        "Look! You found a vault. That vault used AES-256 encryption - unreadable until now.",
        "A legacy waiting to be claimed. Click to decrypt.",
        "Encryption keys released. The vault is yours to open.",
        "Someone trusted you with this. Time to see what's inside.",
        "The timeline has been fulfilled. Access granted.",
    ],
    CREATING: {
        STEP_1: [ // Upload Secret
            "Upload any file - image, text, anything. I'll encrypt it with AES-256.",
            "This is the start of something permanent. What do you want to leave behind?",
            "Your file will be encrypted locally before it ever leaves your device.",
            "Secure your most important documents here. I'll keep them safe.",
        ],
        STEP_2: [ // Beneficiary
            "Who should inherit this? Only they can unlock it with their wallet.",
            "Choose wisely. This person will be the guardian of your legacy.",
            "The decryption key will be locked in a Solana smart contract.",
            "Ensure you have the correct wallet address. Algorithms don't forgive typos.",
            "You're trusting them with your digital life. Good choice?",
        ],
        STEP_3: [ // Anti-Theft Protocol
            "What if someone forces you? Toggle Silent Alarm for emergency duress.",
            "The 5-second hold triggers a secret alert. Attackers see nothing suspicious.",
            "Your emergency contacts will be notified. Location recorded.",
            "This is your fail-safe against coercion. Use it wisely.",
        ],
        STEP_4: [ // Timer
            "How often should I check on you? Set a realistic interval.",
            "The Deadman's Switch: No check-in = protocol execution.",
            "Silence is the trigger. Decide how long silence must last.",
            "Real vaults use 30-365 days. Demo uses 10 seconds.",
        ],
        STEP_5: [ // Deploy
            "Double-check everything. Blockchain transactions are immutable.",
            "Look good? Once deployed, the logic is set in stone.",
            "This is your last chance to verify the recipient address.",
            "We are about to write to the Solana blockchain. Ready?",
            "Deploying contract... Your legacy is being secured.",
        ],
    },
    LIVE: {
        HEALTHY: [ // High time remaining
            "System nominal. All systems go.",
            "You're looking lively today! Check-in not needed yet.",
            "I'm happy to report that your vaults are secure.",
            "Tick tock... but plenty of time left.",
            "Your heartbeat is strong. Carrying on duty.",
            "Scanning for life signs... Verified. Have a great day.",
            "Protocol dormant. Monitoring in background.",
            "The blockchain remembers, so you don't have to worry.",
            "Your legacy is safe with me.",
            "Another day, another block. All is well.",
        ],
        WARNING: [ // < 50% time
            "Hey, haven't heard from you in a while.",
            "Getting a bit lonely here. Check in soon?",
            "Time is slipping away. Just a friendly reminder.",
            "Don't forget your switch! Reset the timer when you can.",
            "I'm sensing silence. Are you there?",
            "Protocol timer is ticking down. Action recommended.",
            "Check-in window is halfway closed.",
            "Slight concern registered. Please ping.",
            "Systems are waiting for your signal.",
            "Just checking: You're still okay, right?",
        ],
        CRITICAL: [ // < 25% time
            "WARNING: Protocol nearing execution threshold!",
            "I need a sign of life! Check in IMMEDIATELY!",
            "Critical alert! Time is running out!",
            "If you don't ping, I will release the keys!",
            "Don't let your legacy trigger yet! PING ME!",
            "DANGER: Deadman's switch activation imminent.",
            "Responding is mandatory to prevent release.",
            "I am about to unlock the vault. Stop me if you can!",
            "Last chance! Reset the timer now!",
            "Are you there?! The countdown is almost zero!",
        ],
    },
    DYING: [
        "😱 Protocol triggered! Releasing keys...",
        "No heartbeat detected. Initiating release sequence.",
        "The fail-safe has been activated.",
        "Executing last will and testament protocol.",
        "It's happening. The seal is breaking.",
    ],
    RELEASED: [
        "🎉 Vault opened! Your encrypted file has been decrypted.",
        "Mission complete. The legacy has been transferred.",
        "The secrets are out. Protocol fulfilled.",
        "Digital Immortality achieved.",
        "My watch has ended. The vault is open.",
    ]
};

export const getRandomMessage = (category: keyof typeof KIP_MESSAGES, subCategory?: string): string => {
    const group = KIP_MESSAGES[category];

    if (Array.isArray(group)) {
        return group[Math.floor(Math.random() * group.length)];
    }

    if (subCategory && typeof group === 'object' && subCategory in group) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subGroup = (group as any)[subCategory];
        if (Array.isArray(subGroup)) {
            return subGroup[Math.floor(Math.random() * subGroup.length)];
        }
    }

    return "System ready.";
};
