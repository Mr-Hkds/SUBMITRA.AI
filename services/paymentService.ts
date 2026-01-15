import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where, runTransaction, increment } from "firebase/firestore";
import { PaymentRequest, User } from "../types";

const REQUESTS_COLLECTION = "payment_requests";
const USERS_COLLECTION = "users";

// Create a new payment request
export const createPaymentRequest = async (userId: string, userEmail: string, amount: number, tokens: number, utr: string, screenshotBase64: string) => {
    try {
        const requestData: Omit<PaymentRequest, 'id'> = {
            userId,
            userEmail,
            amount,
            tokens,
            utr,
            screenshotUrl: screenshotBase64,
            status: 'pending',
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, REQUESTS_COLLECTION), requestData);

        // Admin email notification removed (Manual payment deprecated)
        /*
        try {
            const { sendPaymentNotification } = await import('./emailService');
            // sendPaymentNotification call removed
        } catch (emailError) {
             console.error("Email notification failed", emailError);
        }
        */

        return true;
    } catch (error) {
        console.error("Error creating payment request:", error);
        throw error;
    }
};

export const getPaymentRequests = async (): Promise<PaymentRequest[]> => {
    try {
        const q = query(
            collection(db, REQUESTS_COLLECTION),
            where("status", "==", "pending")
        );
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRequest));

        // Client-side sort to avoid needing complex Firestore Index
        return requests.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error("Error fetching requests:", error);
        return [];
    }
};

export const checkPendingRequest = async (userId: string): Promise<boolean> => {
    try {
        const q = query(
            collection(db, REQUESTS_COLLECTION),
            where("userId", "==", userId),
            where("status", "==", "pending")
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error("Error checking pending request:", error);
        return false;
    }
};

export const approvePayment = async (requestId: string, userId: string) => {
    try {
        // Store user data for email (outside transaction)
        let userEmail: string | null = null;
        let userName: string | null = null;
        let tokensAdded = 0;

        await runTransaction(db, async (transaction) => {
            const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
            const userRef = doc(db, USERS_COLLECTION, userId);

            // READ FIRST: Fetch request data
            const requestSnap = await transaction.get(requestRef);
            if (!requestSnap.exists()) {
                throw new Error("Request does not exist!");
            }
            const requestData = requestSnap.data() as PaymentRequest;
            tokensAdded = requestData.tokens || 0;

            // Fetch user data for email
            const userSnap = await transaction.get(userRef);
            const userData = userSnap.data();

            // Store email data for later (outside transaction)
            if (userData?.email) {
                userEmail = userData.email;
                userName = userData.displayName || 'Valued User';
            }

            // WRITE SECOND: Update Request Status & Delete Screenshot
            transaction.update(requestRef, {
                status: 'approved',
                processedAt: serverTimestamp(),
                screenshotUrl: "DELETED_TO_SAVE_STORAGE" // Remove base64 string
            });

            // WRITE THIRD: Add tokens to user
            transaction.update(userRef, {
                isPremium: true, // Keep legacy flag
                tokens: increment(tokensAdded)
            });
        });

        // Send success email to user AFTER transaction completes successfully
        if (userEmail) {
            try {
                const { sendUserSuccessEmail } = await import('./emailService');
                await sendUserSuccessEmail(userEmail, userName || 'Valued User', tokensAdded);
                console.log('✅ Payment approved and success email sent to user');
            } catch (emailError) {
                console.error("Success email failed (non-critical):", emailError);
                // Don't throw - payment was still approved successfully
            }
        }

        return true;
    } catch (error) {
        console.error("Error approving payment:", error);
        throw error;
    }
};

export const rejectPayment = async (requestId: string) => {
    try {
        const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
        await updateDoc(requestRef, {
            status: 'rejected',
            processedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error rejecting payment:", error);
        throw error;
    }
};
