/**
 * Utility helper to format phone numbers into official WhatsApp universal URLs.
 * Automatically normalizes Indonesian phone prefixes (08xx / 8xx -> 628xx).
 */
export function formatWhatsAppUrl(phone?: string | null, message?: string): string {
    if (!phone) return '';
    let digits = phone.replace(/[^0-9]/g, '');
    if (!digits) return '';

    // Normalize Indonesian numbers
    if (digits.startsWith('0')) {
        digits = '62' + digits.substring(1);
    } else if (digits.startsWith('8')) {
        digits = '62' + digits;
    }

    const base = `https://wa.me/${digits}`;
    if (message) {
        return `${base}?text=${encodeURIComponent(message)}`;
    }
    return base;
}

export default formatWhatsAppUrl;
