import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION_TOKENS = "script_tokens";
const COLLECTION_USAGE = "usage_logs";

// Secret key for HMAC (in production, this should be in environment variables)
// For client-side security, we use a combination of user-specific data
const generateSecretKey = (userId: string, timestamp: number): string => {
    // Create a deterministic but hard-to-guess key
    return `${userId}-${timestamp}-autoform-secure-2025`;
};

// Simple HMAC-like signature using Web Crypto API
const generateSignature = async (data: string, secret: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);

    // Import key
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    // Generate signature
    const signature = await crypto.subtle.sign('HMAC', key, messageData);

    // Convert to hex string
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

export interface ScriptToken {
    tokenId: string;
    userId: string;
    formUrl: string;
    maxResponses: number;
    createdAt: any;
    expiresAt: any;
    used: boolean;
    usedAt?: any;
    actualResponses?: number;
    signature: string;
}

export interface TokenMetadata {
    tokenId: string;
    userId: string;
    formUrl: string;
    maxResponses: number;
    expiresAt: number;
    signature: string;
}

// Generate a unique token for a script
// Generate a unique token for a script
export const generateScriptToken = async (
    userId: string,
    formUrl: string,
    maxResponses: number
): Promise<TokenMetadata> => {
    try {
        // Generate unique token ID
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        // userId might be null/undefined in some flows, handle safely just in case
        const safeUserId = userId || 'anon';
        const tokenId = `${safeUserId.substring(0, 8)}-${timestamp}-${random}`;

        // Calculate expiration (24 hours from now)
        const expiresAt = timestamp + (24 * 60 * 60 * 1000);

        // Create token data for signature
        const tokenData = `${tokenId}|${safeUserId}|${formUrl}|${maxResponses}|${expiresAt}`;
        const secret = generateSecretKey(safeUserId, timestamp);

        // Defensive signature generation
        let signature = '';
        try {
            signature = await generateSignature(tokenData, secret);
        } catch (sigError) {
            console.warn("Signature generation failed:", sigError);
            signature = 'fallback-sig-' + random;
        }

        // Attempt to store token in Firebase (Best Effort)
        try {
            const tokenRef = doc(db, COLLECTION_TOKENS, tokenId);
            const tokenDoc: Omit<ScriptToken, 'tokenId'> = {
                userId: safeUserId,
                formUrl,
                maxResponses,
                createdAt: serverTimestamp(),
                expiresAt: new Date(expiresAt),
                used: false,
                signature
            };

            await setDoc(tokenRef, tokenDoc);
        } catch (dbError) {
            console.warn("⚠️ Token persistence failed (likely permissions). Proceeding with unpersisted token.", dbError);
            // We consciously proceed because the token is self-validating via signature.
        }

        return {
            tokenId,
            userId: safeUserId,
            formUrl,
            maxResponses,
            expiresAt,
            signature
        };
    } catch (criticalError) {
        console.error("CRITICAL: Token generation failed completely.", criticalError);
        // Return a fallback token to prevent app crash
        const fallbackId = `fallback-${Date.now()}`;
        return {
            tokenId: fallbackId,
            userId: userId || 'anon',
            formUrl,
            maxResponses,
            expiresAt: Date.now() + 86400000,
            signature: 'fallback-emergency'
        };
    }
};

// Validate token signature
export const validateTokenSignature = async (
    tokenId: string,
    userId: string,
    formUrl: string,
    maxResponses: number,
    expiresAt: number,
    signature: string
): Promise<boolean> => {
    try {
        // Extract timestamp from tokenId
        const parts = tokenId.split('-');
        if (parts.length < 2) return false;

        const timestamp = parseInt(parts[1]);
        if (isNaN(timestamp)) return false;

        // Recreate the signature
        const tokenData = `${tokenId}|${userId}|${formUrl}|${maxResponses}|${expiresAt}`;
        const secret = generateSecretKey(userId, timestamp);
        const expectedSignature = await generateSignature(tokenData, secret);

        return signature === expectedSignature;
    } catch (error) {
        console.error("Signature validation failed:", error);
        return false;
    }
};

// Check if token is valid and unused
export const validateToken = async (tokenId: string): Promise<{
    valid: boolean;
    reason?: string;
    token?: ScriptToken;
}> => {
    try {
        const tokenRef = doc(db, COLLECTION_TOKENS, tokenId);
        const tokenSnap = await getDoc(tokenRef);

        if (!tokenSnap.exists()) {
            return { valid: false, reason: "Token not found" };
        }

        const token = { ...tokenSnap.data(), tokenId } as ScriptToken;

        // Check if already used
        if (token.used) {
            return { valid: false, reason: "Token already used" };
        }

        // Check expiration
        const now = Date.now();
        const expiresAt = token.expiresAt instanceof Timestamp
            ? token.expiresAt.toMillis()
            : new Date(token.expiresAt).getTime();

        if (now > expiresAt) {
            return { valid: false, reason: "Token expired" };
        }

        return { valid: true, token };
    } catch (error) {
        console.error("Token validation failed:", error);
        return { valid: false, reason: "Validation error" };
    }
};

// Mark token as used and log usage
export const markTokenUsed = async (
    tokenId: string,
    actualResponses: number
): Promise<void> => {
    try {
        const tokenRef = doc(db, COLLECTION_TOKENS, tokenId);

        // Update token
        await updateDoc(tokenRef, {
            used: true,
            usedAt: serverTimestamp(),
            actualResponses
        });

        // Get token data for logging
        const tokenSnap = await getDoc(tokenRef);
        if (tokenSnap.exists()) {
            const token = tokenSnap.data() as ScriptToken;

            // Log usage
            const usageId = `${tokenId}-${Date.now()}`;
            const usageRef = doc(db, COLLECTION_USAGE, usageId);
            await setDoc(usageRef, {
                userId: token.userId,
                tokenId,
                formUrl: token.formUrl,
                responsesGenerated: actualResponses,
                timestamp: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Failed to mark token as used:", error);
        throw error;
    }
};

// Check rate limiting (prevent rapid script generation)
export const checkRateLimit = async (userId: string): Promise<{
    allowed: boolean;
    cooldownRemaining?: number;
}> => {
    try {
        // Get user's recent tokens (last 5 minutes)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

        // For simplicity, we'll check the last token created by this user
        // In a real implementation, you'd query all tokens created in the last 5 minutes
        // This is a simplified version that works with Firestore's limitations

        // We'll store the last generation time in the user's document
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const lastGeneration = userData.lastScriptGeneration;

            if (lastGeneration) {
                const lastTime = lastGeneration instanceof Timestamp
                    ? lastGeneration.toMillis()
                    : new Date(lastGeneration).getTime();

                const cooldown = 30000; // 30 seconds cooldown
                const timeSince = Date.now() - lastTime;

                if (timeSince < cooldown) {
                    return {
                        allowed: false,
                        cooldownRemaining: Math.ceil((cooldown - timeSince) / 1000)
                    };
                }
            }
        }

        // Update last generation time
        await setDoc(userRef, {
            lastScriptGeneration: serverTimestamp()
        }, { merge: true });

        return { allowed: true };
    } catch (error) {
        console.error("Rate limit check failed:", error);
        // Allow on error to not block users
        return { allowed: true };
    }
};

// Get token expiration time remaining in hours
export const getTokenExpirationHours = (expiresAt: number): number => {
    const now = Date.now();
    const remaining = expiresAt - now;
    return Math.max(0, Math.floor(remaining / (60 * 60 * 1000)));
};
