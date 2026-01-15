export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { paymentId, amount } = req.body;

        if (!paymentId || !amount) {
            res.status(400).json({ error: 'Missing paymentId or amount' });
            return;
        }

        const keyId = process.env.VITE_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error('Razorpay keys missing in environment variables');
            res.status(500).json({ error: 'Server configuration error: Keys missing' });
            return;
        }

        // Amount in paise (Razorpay expects amount in smallest currency unit)
        const amountInPaise = Math.round(amount * 100);

        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

        console.log(`Verifying and capturing payment: ${paymentId} for ₹${amount}`);

        // Call Razorpay Capture API
        const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amountInPaise,
                currency: 'INR'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Razorpay Capture Error:', data);
            res.status(response.status).json({
                error: data.error?.description || 'Failed to capture payment',
                details: data
            });
            return;
        }

        console.log('Payment captured successfully:', data.id);

        res.status(200).json({
            success: true,
            payment: data
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
