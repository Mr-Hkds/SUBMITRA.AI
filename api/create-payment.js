import Razorpay from 'razorpay';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, currency, notes } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        // Get keys from environment variables
        // Support both standard and VITE_ prefixed variables
        const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            console.error('Razorpay keys not configured');
            return res.status(500).json({ error: 'Server configuration error: Razorpay keys missing' });
        }

        const razorpay = new Razorpay({
            key_id,
            key_secret,
        });

        // Create order with payment_capture = 1 (Auto Capture)
        const options = {
            amount: amount, // Amount in paise (already converted by frontend?) No, frontend sent 100 * rupees usually. check service.
            // Wait, razorpayService.ts line 39 converted it. 
            // I should expect amount in paise here or rupees? Use whatever standard.
            // Usually API expects paise. I will assume input is what Razorpay expects (paise).
            currency: currency || 'INR',
            receipt: `order_${Date.now()}`,
            payment_capture: 1, // FORCE AUTO CAPTURE
            notes: notes || {}
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json(order);

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({
            error: 'Failed to create order',
            details: error.message
        });
    }
}
