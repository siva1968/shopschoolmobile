/**
 * Decode JWT token without verification (for client-side use only)
 * This is safe for reading non-sensitive claims like user ID, expiration, etc.
 */
export function decode(token: string): Record<string, unknown> | null {
  try {
    // Remove quotes if token is stringified
    const cleanToken = token.replace(/"/g, '');
    
    // JWT has 3 parts separated by dots
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode from base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    // exp is in seconds, Date.now() is in milliseconds
    const exp = typeof decoded.exp === 'number' ? decoded.exp : parseInt(String(decoded.exp), 10);
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
