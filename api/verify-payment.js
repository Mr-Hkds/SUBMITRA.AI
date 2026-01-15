
import crypto from 'crypto';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { orderId, paymentId, signature } = req.body;

        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;

        if (!key_secret) {
            console.error('Razorpay secret key not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const generated_signature = crypto
            .createHmac('sha256', key_secret)
            .update(orderId + '|' + paymentId)
            .digest('hex');

        if (generated_signature === signature) {
            return res.status(200).json({ valid: true });
        } else {
            return res.status(400).json({ valid: false, error: 'Invalid signature' });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            error: 'Verification failed',
            details: error.message
        });
    }
}
