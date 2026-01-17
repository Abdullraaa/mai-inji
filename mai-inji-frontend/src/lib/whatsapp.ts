/**
 * WhatsApp Integration Utility for Mai Inji Soft Launch
 * Directs users to the official business WhatsApp line.
 */

const WHATSAPP_NUMBER = "2348166852378";

/**
 * Encodes a message and opens it in a new WhatsApp chat window.
 * @param message The structured message to send to the business.
 */
export function sendToWhatsApp(message: string) {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

    if (typeof window !== 'undefined') {
        window.open(url, "_blank");
    }
}
