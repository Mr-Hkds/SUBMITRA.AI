// Email notification service using EmailJS
// Sends admin notifications and user success emails
// Gracefully handles failures - app continues working even if emails fail

const EMAILJS_SERVICE_ID = "service_7ugwyn5";
const EMAILJS_TEMPLATE_ID = "template_zxxt7jd"; // Admin notification
const EMAILJS_USER_SUCCESS_TEMPLATE = "template_f8cucfg"; // User success
const EMAILJS_PUBLIC_KEY = "QX6p57cN59CkTOalx";

export interface EmailNotificationData {
    userEmail: string;
    userName?: string;
    amount: number;
    tokens: number;
    utr: string;
    timestamp: string;
}

// Send notification to admin when new payment request is created
export const sendPaymentNotification = async (data: EmailNotificationData): Promise<boolean> => {
    try {
        const templateParams = {
            to_email: "naagraazproduction@gmail.com",
            subject: "New Payment Request - AutoForm",
            user_email: data.userEmail,
            user_name: data.userName || "Unknown User",
            amount: `₹${data.amount}`,
            tokens: data.tokens,
            utr: data.utr,
            timestamp: data.timestamp,
            admin_url: window.location.origin + "/admin"
        };

        const emailjs = (window as any).emailjs;
        if (!emailjs) {
            console.warn("⚠️ EmailJS not loaded - email notification skipped");
            return false;
        }

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);

        console.log("📧 Admin notification sent successfully!");
        return true;
    } catch (error: any) {
        // Gracefully handle all email errors - don't break the app
        if (error?.status === 429) {
            console.warn("⚠️ EmailJS rate limit reached (200/month) - email skipped, payment still processed");
        } else if (error?.status === 400) {
            console.warn("⚠️ EmailJS template issue - email skipped, payment still processed");
        } else {
            console.warn("⚠️ Email notification failed (non-critical):", error?.message || error);
        }
        return false;
    }
};

// Send success email to user when payment is approved
export const sendUserSuccessEmail = async (userEmail: string, userName: string, tokens: number): Promise<boolean> => {
    try {
        const templateParams = {
            to_email: userEmail,
            to_name: userName || "Valued User",
            subject: "🎉 Payment Approved - Tokens Credited!",
            tokens: tokens,
            support_email: "naagraazproduction@gmail.com",
            app_url: window.location.origin
        };

        const emailjs = (window as any).emailjs;
        if (!emailjs) {
            console.warn("⚠️ EmailJS not loaded - email notification skipped");
            return false;
        }

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_USER_SUCCESS_TEMPLATE, templateParams, EMAILJS_PUBLIC_KEY);

        console.log("🎉 User success email sent successfully!");
        return true;
    } catch (error: any) {
        // Gracefully handle all email errors - don't break the app
        if (error?.status === 429) {
            console.warn("⚠️ EmailJS rate limit reached (200/month) - email skipped, tokens still credited");
        } else if (error?.status === 400) {
            console.warn("⚠️ EmailJS template issue - email skipped, tokens still credited");
        } else {
            console.warn("⚠️ Email notification failed (non-critical):", error?.message || error);
        }
        return false;
    }
};
