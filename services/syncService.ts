import { verifyAndCapturePayment } from "./razorpayService";

const PENDING_PAYMENTS_KEY = "payments:pending_verification";

interface PendingPayment {
    paymentId: string;
    amount: number;
    userId: string;
    timestamp: number;
}

/**
 * Persist a failed payment verification for later retry
 */
const storage = (window as any).storage;
if (!storage) {
    console.warn("[SyncService] window.storage is not available. Verification skipping persistence.");
    return;
}

const existingRaw = await storage.get(PENDING_PAYMENTS_KEY);
const existing: PendingPayment[] = existingRaw ? JSON.parse(existingRaw) : [];

// Avoid duplicates
if (existing.some(p => p.paymentId === paymentId)) return;

const updated = [...existing, {
    paymentId,
    amount,
    userId,
    timestamp: Date.now()
}];

await (window as any).storage.set(PENDING_PAYMENTS_KEY, JSON.stringify(updated));
console.log(`[SyncService] Saved pending payment: ${paymentId}`);
    } catch (error) {
    console.error("[SyncService] Failed to save pending payment:", error);
}
};

/**
 * Attempt to verify all pending payments
 */
export const syncPendingPayments = async () => {
    try {
        const storage = (window as any).storage;
        if (!storage) return;

        const existingRaw = await storage.get(PENDING_PAYMENTS_KEY);
        if (!existingRaw) return;

        const pending: PendingPayment[] = JSON.parse(existingRaw);
        if (pending.length === 0) return;

        console.log(`[SyncService] Found ${pending.length} pending payments. Attempting sync...`);

        const remaining: PendingPayment[] = [];

        for (const payment of pending) {
            try {
                // Attempt verification
                await verifyAndCapturePayment(payment.paymentId, payment.amount, payment.userId);
                console.log(`[SyncService] Successfully recovered payment: ${payment.paymentId}`);
            } catch (error) {
                console.warn(`[SyncService] Recovery failed for ${payment.paymentId}, will retry later:`, error);

                // Keep if not too old (e.g., older than 48 hours)
                const ageHours = (Date.now() - payment.timestamp) / (1000 * 60 * 60);
                if (ageHours < 48) {
                    remaining.push(payment);
                } else {
                    console.error(`[SyncService] Payment ${payment.paymentId} expired after 48h and was dropped.`);
                }
            }
        }

        // Update storage with remaining
        if (remaining.length === 0) {
            await (window as any).storage.remove(PENDING_PAYMENTS_KEY);
        } else {
            await (window as any).storage.set(PENDING_PAYMENTS_KEY, JSON.stringify(remaining));
        }
    } catch (error) {
        console.error("[SyncService] Sync process error:", error);
    }
};
