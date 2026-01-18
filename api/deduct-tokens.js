const admin = require('firebase-admin');

// Initialize Firebase Admin (Singleton pattern)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized for Token Deduction");
    } catch (error) {
        console.error("Firebase Admin Initialization Error:", error);
    }
}

const db = admin.firestore();

/**
 * API Handler for Secure Token Deduction
 * This prevents client-side manipulation of token balances.
 */
module.exports = async (req, res) => {
    // CORS headers for local and production
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { uid, amount } = req.body;

    if (!uid || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid request parameters' });
    }

    try {
        const userRef = db.collection('users').doc(uid);

        const result = await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) {
                throw new Error("User record not found");
            }

            const userData = userDoc.data();
            const currentTokens = userData.tokens || 0;

            if (currentTokens < amount) {
                return { success: false, error: 'INSUFFICIENT_TOKENS', currentTokens };
            }

            // Perform Atomic Deduction
            transaction.update(userRef, {
                tokens: admin.firestore.FieldValue.increment(-amount),
                responsesUsed: admin.firestore.FieldValue.increment(amount)
            });

            return { success: true, newTokens: currentTokens - amount };
        });

        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(403).json(result);
        }

    } catch (error) {
        console.error('Secure Token Deduction Error:', error);
        return res.status(500).json({
            error: 'Failed to process token deduction',
            message: error.message
        });
    }
};
