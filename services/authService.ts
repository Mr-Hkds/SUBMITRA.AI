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
    tokens: 15, // Default starting tokens
    createdAt: new Date(), // These might be inaccurate for existing users without DB, but fine for fallback
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

export const deductTokens = async (uid: string, amount: number) => {
    try {
        const userRef = doc(db, COLLECTION, uid);
        await updateDoc(userRef, {
            tokens: increment(-amount),
            responsesUsed: increment(amount)
        });
        return true;
    } catch (e) {
        console.error("Failed to deduct tokens:", e);
        return false;
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

// Legacy support: Increment usage count (now just a wrapper or deprecated)
export const incrementUsageCount = async (uid: string, count: number) => {
    // Replaced by deductTokens in new flow, keeping for backward compat if needed
    await deductTokens(uid, count);
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
                    // Fetch again or just assume it worked? 
                    // Let's just rely on the fallbackUser until the subscription (if any) picks up updates,
                    // or just trigger callback again with the "new" profile if we want to be precise.
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
