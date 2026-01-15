// Email notification service using EmailJS
// Sends user success emails only (Admin notifications removed as per new flow)
// Gracefully handles failures - app continues working even if emails fail

const EMAILJS_SERVICE_ID = "service_7ugwyn5";
const EMAILJS_USER_SUCCESS_TEMPLATE = "template_f8cucfg"; // User success
const EMAILJS_PUBLIC_KEY = "QX6p57cN59CkTOalx";

// Send success email to user when payment is approved
export const sendUserSuccessEmail = async (userEmail: string, userName: string, tokens: number): Promise<boolean> => {
    try {
        console.log(`📧 Preparing to send success email to USER: ${userEmail} (NOT admin)`);

        const templateParams = {
            to_email: userEmail, // THIS GOES TO THE USER, NOT ADMIN
            to_name: userName || "Valued User",
            subject: "🎉 Payment Approved - Tokens Credited!",
            tokens: tokens,
            support_email: "naagraazproduction@gmail.com",
            app_url: window.location.origin
        };

        console.log(`📧 Email will be sent to: ${templateParams.to_email}`);

        const emailjs = (window as any).emailjs;
        if (!emailjs) {
            console.warn("⚠️ EmailJS not loaded - email notification skipped");
            return false;
        }

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_USER_SUCCESS_TEMPLATE, templateParams, EMAILJS_PUBLIC_KEY);

        console.log(`✅ User success email sent successfully to: ${userEmail}`);
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
