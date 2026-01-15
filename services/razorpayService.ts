/**
 * Razorpay Payment Service
 * Handles payment order creation and verification
 */

import { RAZORPAY_CONFIG, CURRENCY, validateRazorpayConfig } from './razorpayConfig';

export interface PaymentOrderData {
    amount: number; // Amount in rupees
    tokens: number;
    userEmail: string;
    userId: string;
    userName?: string;
}

export interface RazorpayOrder {
    orderId: string;
    amount: number; // Amount in paise
    currency: string;
}

/**
 * Create a Razorpay payment order
 */
export const createPaymentOrder = async (data: PaymentOrderData): Promise<RazorpayOrder> => {
    try {
        // Validate config
        if (!validateRazorpayConfig()) {
            throw new Error('Razorpay configuration is invalid. Please add your API keys.');
        }

        console.log(`📦 Creating Razorpay order for ₹${data.amount} (${data.tokens} tokens)`);

        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: data.amount * 100, // Convert rupees to paise
                currency: CURRENCY,
                notes: {
                    userId: data.userId,
                    userEmail: data.userEmail,
                    userName: data.userName || '',
                    tokens: data.tokens.toString(),
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create payment order');
        }

        const order = await response.json();
        const orderId = order.id;

        console.log(`✅ Order created: ${orderId}`);

        return {
            orderId,
            amount: order.amount,
            currency: order.currency,
        };

    } catch (error: any) {
        console.error('❌ Failed to create Razorpay order:', error);
        throw new Error(`Order creation failed: ${error.message}`);
    }
};

/**
 * Verify payment signature
 * IMPORTANT: This should be done on the backend for security!
 */
/**
 * Verify payment signature
 * IMPORTANT: This passes verification to backend
 */
export const verifyPaymentSignature = async (
    orderId: string,
    paymentId: string,
    signature: string
): Promise<boolean> => {
    try {
        console.log('🔐 Verifying payment signature...');

        const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId,
                paymentId,
                signature
            }),
        });

        if (!response.ok) {
            console.error('❌ Signature verification failed on server');
            return false;
        }

        const data = await response.json();

        if (data.valid) {
            console.log('✅ Payment signature verified');
            return true;
        } else {
            console.warn('❌ Invalid signature');
            return false;
        }

    } catch (error) {
        console.error('❌ Signature verification error:', error);
        return false;
    }
};

/**
 * Fetch payment details from Razorpay
 */
export const fetchPaymentDetails = async (paymentId: string): Promise<any> => {
    try {
        console.log(`📄 Fetching payment details for: ${paymentId}`);

        // TODO: Call Razorpay API to fetch payment details
        // This requires backend implementation

        return {
            id: paymentId,
            status: 'captured',
            method: 'upi',
        };

    } catch (error) {
        console.error('❌ Failed to fetch payment details:', error);
        return null;
    }
};

/**
 * Initialize Razorpay checkout
 */
export const initializeRazorpayCheckout = (
    order: RazorpayOrder,
    data: PaymentOrderData,
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void
) => {
    try {
        // Check if Razorpay is loaded
        if (!(window as any).Razorpay) {
            throw new Error('Razorpay script not loaded. Please refresh the page.');
        }

        const options = {
            key: RAZORPAY_CONFIG.keyId,
            amount: order.amount,
            currency: order.currency,
            name: 'AutoForm',
            description: `${data.tokens} Tokens`,
            // Pass the Order ID created via backend
            order_id: order.orderId,
            prefill: {
                email: data.userEmail,
                name: data.userName || data.userEmail.split('@')[0],
            },
            theme: {
                color: '#F59E0B', // Amber color
            },
            retry: {
                enabled: true,
            },
            handler: function (response: any) {
                console.log('✅ Payment successful:', response);
                onSuccess(response);
            },
            modal: {
                ondismiss: function () {
                    console.log('❌ Payment cancelled by user');
                    onFailure(new Error('Payment cancelled'));
                },
            },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();

    } catch (error: any) {
        console.error('❌ Razorpay checkout initialization failed:', error);
        onFailure(error);
    }
};
