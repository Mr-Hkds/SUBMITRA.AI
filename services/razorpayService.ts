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

        // In a real implementation, this should go through your backend
        // For now, we'll use client-side order creation (less secure but simpler)
        // You should move this to a Firebase Cloud Function in production!

        const orderData = {
            amount: data.amount * 100, // Convert rupees to paise
            currency: CURRENCY,
            receipt: `order_${Date.now()}`,
            notes: {
                userId: data.userId,
                userEmail: data.userEmail,
                userName: data.userName || '',
                tokens: data.tokens.toString(),
            },
        };

        // TODO: Call your backend API to create order
        // For now, we'll create a mock order ID
        const orderId = `order_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log(`✅ Order created: ${orderId}`);

        return {
            orderId,
            amount: orderData.amount,
            currency: orderData.currency,
        };

    } catch (error: any) {
        console.error('❌ Failed to create Razorpay order:', error);
        throw new Error(`Order creation failed: ${error.message}`);
    }
};

/**
 * Verify and Capture payment via Backend
 * This calls our secure backend endpoint which communicates with Razorpay
 */
export const verifyAndCapturePayment = async (
    paymentId: string,
    amount: number,
    userId?: string
): Promise<any> => {
    try {
        console.log(`🔐 Verifying and capturing payment: ${paymentId} for ₹${amount}`);

        // Call our backend API (works on Vercel and Local Vite Proxy)
        const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentId,
                amount,
                userId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Payment verification failed');
        }

        console.log('✅ Payment verified and captured successfully:', data);
        return data;

    } catch (error: any) {
        console.error('❌ Verification/Capture failed:', error);
        throw error;
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
            name: 'Submitra',
            description: `${data.tokens} Tokens`,
            // Only pass order_id if it's a real Razorpay order (captured from backend)
            // If it's a mock client-side ID (contains '_mock_'), we omit it to allow "Standard Checkout"
            ...(order.orderId && !order.orderId.includes('_mock_') ? { order_id: order.orderId } : {}),
            /*
             * NOTE: For client-side integration without backend, we DO NOT pass order_id if it's mock.
             * Razorpay will create a payment_id.
             */
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
            // FORCE PAYMENT CAPTURE - Set to 1 explicitly
            // This ensures payments are captured immediately and not left in "Authorized" state
            payment_capture: 1,

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
