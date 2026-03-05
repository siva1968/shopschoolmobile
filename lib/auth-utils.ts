/**
 * Decode a JWT token without verification (client-side only).
 * Returns the payload or null if invalid.
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url → base64 → decode using atob (available in RN Hermes)
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(
      decodeURIComponent(
        Array.from(atob(padded))
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      )
    );
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if a decoded JWT payload is still valid (not expired).
 */
export function isTokenValid(decoded: Record<string, unknown>): boolean {
  const exp = decoded["exp"];
  if (typeof exp !== "number") return false;
  return exp * 1000 > Date.now();
}

/**
 * Strip the `+suffix` added server-side to emails.
 * e.g. "parent+13E010@gmail.com" → "parent@gmail.com"
 */
export function reconstructEmail(email?: string): string {
  if (!email) return "";
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return email;
  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const plusIndex = localPart.lastIndexOf("+");
  if (plusIndex === -1) return email;
  return `${localPart.slice(0, plusIndex)}@${domain}`;
}

/**
 * Format currency amount (paise → rupees).
 */
export function formatPrice(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
