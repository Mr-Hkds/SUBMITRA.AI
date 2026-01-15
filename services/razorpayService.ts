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
 * Verify payment signature
 * IMPORTANT: This should be done on the backend for security!
 */
export const verifyPaymentSignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    try {
        // In production, send this to your backend for verification
        // Backend should use Razorpay's signature verification

        console.log('🔐 Verifying payment signature...');
        console.log('Order ID:', orderId);
        console.log('Payment ID:', paymentId);
        console.log('Signature:', signature);

        // For now, we'll assume signature is valid
        // TODO: Implement server-side verification
        console.log('✅ Payment signature verified (mock)');

        return true;

    } catch (error) {
        console.error('❌ Signature verification failed:', error);
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
            // FORCE PAYMENT CAPTURE
            // This ensures payments are captured immediately and not left in "Authorized" state
            // preventing auto-refunds after 10-15 mins.
            // Note: If sending order_id from backend, capture is usually defined there, 
            // but this is safe for Standard Checkout.
            ...(order.orderId && !order.orderId.includes('_mock_') ? {} : { payment_capture: 1 }),

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
