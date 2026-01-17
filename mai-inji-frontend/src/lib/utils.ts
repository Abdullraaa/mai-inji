/**
 * Format amount in kobo to Nigerian Naira with ₦ symbol
 * @param amount Amount in kobo (e.g., 250000 = ₦2,500)
 * @returns Formatted string (e.g., "₦2,500")
 */
export function formatCurrency(amount: number): string {
  const naira = amount / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(naira);
}

/**
 * Validate Nigerian phone number
 * Accepts formats: 234XXXXXXXXXX (with country code)
 * @param phone Phone number string
 * @returns true if valid, false otherwise
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^234\d{10}$/.test(cleaned);
}

/**
 * Format phone number to 234XXXXXXXXXX format
 * @param phone Phone number (various formats accepted)
 * @returns Formatted phone: 234XXXXXXXXXX
 */
export function formatPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  // If it starts with 0, replace with 234
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.slice(1);
  }

  // If it doesn't start with 234, prepend it
  if (!cleaned.startsWith('234')) {
    cleaned = '234' + cleaned;
  }

  return cleaned;
}

/**
 * Validate email address
 * @param email Email string
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate delivery address (must contain "Lafia" for v1)
 * @param address Delivery address
 * @returns true if valid, false otherwise
 */
export function validateAddress(address: string): boolean {
  return address.toLowerCase().includes('lafia') && address.length > 10;
}

/**
 * Format ISO datetime to readable format
 * @param dateString ISO 8601 datetime string
 * @returns Formatted string (e.g., "Jan 9, 2026 10:30 AM")
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (error) {
    return dateString;
  }
}

/**
 * Format ISO date to readable format
 * @param dateString ISO 8601 date string
 * @returns Formatted string (e.g., "Jan 9, 2026")
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    return dateString;
  }
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param dateString ISO 8601 datetime string
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return formatDate(dateString);
  } catch (error) {
    return dateString;
  }
}

/**
 * Convert kobo to Naira (divide by 100)
 * @param kobo Amount in kobo
 * @returns Amount in Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Convert Naira to kobo (multiply by 100)
 * @param naira Amount in Naira
 * @returns Amount in kobo
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}
