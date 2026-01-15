/**
 * Application Configuration
 * 
 * This file contains global constants and configuration values for the application.
 * It supports environment variables for easy updates in production (e.g., Vercel).
 */

export const APP_CONFIG = {
    // Demo Video URL - Can be updated via VITE_DEMO_VIDEO_URL environment variable
    // Supports YouTube embed links (e.g., https://www.youtube.com/embed/VIDEO_ID)
    // Placeholder video for now
    DEMO_VIDEO_URL: (import.meta as any).env?.VITE_DEMO_VIDEO_URL || "https://www.youtube.com/embed/dQw4w9WgXcQ",

    // Branding
    BRAND_NAME: "AutoForm",
    TAGLINE: "A NaagRaaz Production",
    DEVELOPER_NAME: "Mr. Harkamal",
};
