/**
 * Structured Message Formatters for WhatsApp-first Commerce
 */

type OrderItem = {
    name: string;
    quantity: number;
    price?: number;
};

interface OrderParams {
    customerName?: string;
    phone?: string;
    items: OrderItem[];
    notes?: string;
    total?: number;
}

/**
 * Formats a clear, professional order summary for WhatsApp.
 */
export function formatOrderMessage(params: OrderParams): string {
    const { customerName, phone, items, notes, total } = params;

    const itemLines = items
        .map(
            (i, idx) =>
                `${idx + 1}. ${i.name} x${i.quantity}${i.price ? ` — ₦${(i.price / 100).toLocaleString()}` : ""}`
        )
        .join("\n");

    const formattedTotal = total ? `₦${(total / 100).toLocaleString()}` : null;

    return `
🛒 *NEW ORDER — MAI INJI*

👤 Name: ${customerName ?? "Not provided"}
📞 Phone: ${phone ?? "Not provided"}

📦 Order Items:
${itemLines}

${formattedTotal ? `💰 Estimated Total: ${formattedTotal}` : ""}

📝 Notes:
${notes ?? "None"}

📍 Sent from Mai Inji Website
  `.trim();
}

interface FeedbackParams {
    name?: string;
    phone?: string;
    message: string;
    type?: 'FEEDBACK' | 'INQUIRY' | 'SUPPORT';
}

/**
 * Formats a structured feedback or inquiry message for WhatsApp.
 */
export function formatFeedbackMessage(params: FeedbackParams): string {
    const title = params.type ? `*${params.type}*` : "*CUSTOMER MESSAGE*";

    return `
💬 ${title} — MAI INJI

👤 Name: ${params.name ?? "Anonymous"}
📞 Phone: ${params.phone ?? "Not provided"}

📝 Message:
${params.message}

📍 Sent from Mai Inji Website
  `.trim();
}
