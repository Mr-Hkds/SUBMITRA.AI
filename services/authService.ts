import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import { User } from "../types";

const COLLECTION = "users";

// Helper to map Firebase User to App User (default state)
const mapFirebaseUserToUser = (firebaseUser: any): User => ({
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || "User",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || "",
    isPremium: false,
    responsesUsed: 0,
    tokens: 15, // Default to 15 (Free Tier) to match creation logic and avoid 0-flash
    createdAt: new Date(),
    lastLogin: new Date()
});

export const signInWithGoogle = async (): Promise<User> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;

        // 1. Immediate optimistic return
        let appUser = mapFirebaseUserToUser(firebaseUser);

        try {
            // 2. Try to sync with DB
            const userRef = doc(db, COLLECTION, firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                // User exists, update last login and sync profile data
                await updateDoc(userRef, {
                    lastLogin: serverTimestamp(),
                    email: firebaseUser.email || "",
                    displayName: firebaseUser.displayName || "User",
                    photoURL: firebaseUser.photoURL || ""
                });
                appUser = {
                    ...userSnap.data(),
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || userSnap.data().email || "",
                    displayName: firebaseUser.displayName || userSnap.data().displayName || "User",
                    photoURL: firebaseUser.photoURL || userSnap.data().photoURL || ""
                } as User;
            } else {
                // New User -> Create Free Tier Doc
                const newUser: Omit<User, 'uid'> = {
                    displayName: firebaseUser.displayName || "User",
                    email: firebaseUser.email || "",
                    photoURL: firebaseUser.photoURL || "",
                    isPremium: false,
                    isAdmin: false,
                    responsesUsed: 0,
                    tokens: 15, // Default starting tokens
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                };

                await setDoc(userRef, newUser);
                appUser = { ...newUser, uid: firebaseUser.uid } as User;
            }
        } catch (dbError) {
            console.error("Firestore persistence failed, falling back to basic auth:", dbError);
            // We already have the appUser from the map function, so we just proceed
        }

        return appUser;

    } catch (error) {
        console.error("Login Failed:", error);
        throw error;
    }
};

export const logout = async () => {
    await firebaseSignOut(auth);
};

export const subscribeToUserProfile = (uid: string, callback: (user: User | null) => void) => {
    const userRef = doc(db, COLLECTION, uid);
    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            callback({ ...doc.data(), uid } as User);
        } else {
            // If doc disappears (rare), strictly speaking they might just be missing profile data
            // but for subscription we can just return null or keep previous state.
            // Returning null usually implies "not found" which might be safe.
            callback(null);
        }
    }, (error) => {
        console.error("Profile subscription error:", error);
        // Don't kill the session just because subscription failed
    });
};

export const deductTokens = async (uid: string, amount: number): Promise<{ success: boolean; newTokens?: number }> => {
    console.log(`[AuthService] Attempting to deduct ${amount} tokens for user ${uid}. Env: ${import.meta.env.DEV ? 'DEV' : 'PROD'}`);
    try {
        // DEV MODE: Direct Firestore Update (Efficiency & Local Persistence)
        // Now allowed by relaxed Firestore Rules (safe decrement only)
        if (import.meta.env.DEV) {
            console.log("[AuthService] Dev Mode: Deducting tokens directly via Firestore...");
            const userRef = doc(db, COLLECTION, uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const currentTokens = userSnap.data().tokens || 0;
                console.log(`[AuthService] Current tokens: ${currentTokens}. Required: ${amount}`);
                if (currentTokens >= amount) {
                    await updateDoc(userRef, {
                        tokens: increment(-amount),
                        responsesUsed: increment(amount)
                    });
                    console.log(`[AuthService] ✅ Firestore update successful. New balance should be ${currentTokens - amount}`);
                    return { success: true, newTokens: currentTokens - amount };
                } else {
                    console.error("[AuthService] Insufficient tokens");
                    return { success: false };
                }
            } else {
                console.error("[AuthService] User document does not exist");
            }
            return { success: false };
        }

        // PROD MODE: Secure Server Call
        console.log("[AuthService] Prod Mode: Calling secure API...");
        const response = await fetch('/api/deduct-tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid, amount })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Server refused token deduction:", data);
            return { success: false };
        }

        console.log("[AuthService] ✅ API deduction successful. New Tokens:", data.newTokens);
        return { success: true, newTokens: data.newTokens };
    } catch (e) {
        console.error("Failed to deduct tokens (Network/Auth):", e);
        return { success: false };
    }
};

export const addTokens = async (uid: string, amount: number) => {
    try {
        const userRef = doc(db, COLLECTION, uid);
        await updateDoc(userRef, {
            tokens: increment(amount)
        });
        return true;
    } catch (e) {
        console.error("Failed to add tokens:", e);
        return false;
    }
};

export const checkPendingRequest = async (uid: string): Promise<boolean> => {
    try {
        // To avoid bringing in complex query setup if missing index, we can just do a simple fetch if user volume is low,
        // or properly use query. Assuming basic get functionality here based on structure, or we can use the backend
        // For simplicity we will check via a REST call or a targeted query if imported.
        // Let's import query and where from firestore at the top and do it cleanly.
        const { query, where, getDocs, collection } = await import("firebase/firestore");
        const q = query(collection(db, "tokenRequests"), where("userId", "==", uid), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (e) {
        console.error("Failed to check pending requests:", e);
        return false;
    }
};

export const submitTokenRequest = async (user: User, amount: number): Promise<{ success: boolean; message: string }> => {
    try {
        if (amount < 1 || amount > 500) {
            return { success: false, message: "Request amount must be between 1 and 500." };
        }

        const hasPending = await checkPendingRequest(user.uid);
        if (hasPending) {
            return { success: false, message: "You already have a pending token request." };
        }

        const { collection, addDoc } = await import("firebase/firestore");
        await addDoc(collection(db, "tokenRequests"), {
            userId: user.uid,
            userEmail: user.email || "Unknown",
            userName: user.displayName || "Unknown User",
            requestedAmount: amount,
            status: "pending",
            createdAt: serverTimestamp()
        });

        return { success: true, message: "Token request submitted successfully." };
    } catch (e) {
        console.error("Failed to submit token request:", e);
        return { success: false, message: "An error occurred while submitting." };
    }
};

export const recordTransaction = async (paymentId: string, amount: number, tokens: number, uid: string, packId: string) => {
    try {
        const transactionRef = doc(db, "transactions", paymentId);
        await setDoc(transactionRef, {
            userId: uid,
            paymentId,
            amount,
            tokens,
            packId,
            status: 'completed',
            method: 'razorpay_upi', // Simplified for client-side
            createdAt: serverTimestamp(),
            timestamp: new Date().toISOString(),
            source: 'client_fallback' // Mark as fallback to distinguish from server-side
        });
        console.log("[AuthService] Transaction recorded successfully");
        return true;
    } catch (e) {
        console.error("Failed to record transaction:", e);
        return false;
    }
};

// Legacy support: Increment usage count (now just a wrapper or deprecated)
export const incrementUsageCount = async (uid: string, count: number) => {
    // Replaced by deductTokens in new flow, keeping for backward compat if needed
    return await deductTokens(uid, count);
};

export const upgradeUserToPremium = async (uid: string) => {
    const userRef = doc(db, COLLECTION, uid);
    await updateDoc(userRef, {
        isPremium: true
    });
};

export const verifyLicenseKey = async (uid: string, key: string): Promise<boolean> => {
    const VALID_KEYS = ["PRO-2025", "AUTOFORM-X", "ADMIN-KEY"];

    if (VALID_KEYS.includes(key.toUpperCase().trim())) {
        await upgradeUserToPremium(uid);
        return true;
    }
    return false;
};

// Ensure a user profile exists in Firestore (Self-Healing)
const ensureUserProfile = async (firebaseUser: any) => {
    try {
        const userRef = doc(db, COLLECTION, firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const newUser: Omit<User, 'uid'> = {
                displayName: firebaseUser.displayName || "User",
                email: firebaseUser.email || "",
                photoURL: firebaseUser.photoURL || "",
                isPremium: false,
                isAdmin: false,
                responsesUsed: 0,
                tokens: 15,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            };
            await setDoc(userRef, newUser);
        }
    } catch (e) {
        console.error("Failed to ensure user profile:", e);
    }
};

export const trackAuthState = (callback: (user: User | null) => void) => {
    return auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
            // 1. IMMEDIATE: Map Firebase Auth User to App User (Optimistic)
            // This ensures we have a session even if Firestore is slow/down
            const fallbackUser = mapFirebaseUserToUser(firebaseUser);
            callback(fallbackUser);

            // 2. ASYNC: Try to fetch/create full profile
            try {
                const userRef = doc(db, COLLECTION, firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    // Merge Firestore data with fresh Auth data (ensure email is up-to-date)
                    callback({
                        ...userSnap.data(),
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || userSnap.data().email || "", // Prefer Auth email
                        displayName: firebaseUser.displayName || userSnap.data().displayName || "User",
                        photoURL: firebaseUser.photoURL || userSnap.data().photoURL || ""
                    } as User);
                } else {
                    // Self-heal: Create missing profile
                    await ensureUserProfile(firebaseUser);

                    // Fetch the newly created profile to ensure we have the correct tokens (15)
                    const newUserSnap = await getDoc(userRef);
                    if (newUserSnap.exists()) {
                        callback({
                            ...newUserSnap.data(),
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || newUserSnap.data().email || "",
                            displayName: firebaseUser.displayName || newUserSnap.data().displayName || "User",
                            photoURL: firebaseUser.photoURL || newUserSnap.data().photoURL || ""
                        } as User);
                    }
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                // We typically just stick with the fallbackUser we already sent
            }
        } else {
            callback(null);
        }
    });
};
