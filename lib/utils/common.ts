/**
 * Reconstructs the original email by removing the "+..." part before the "@".
 * Example: "some+13E010010@yahoo.com" => "some@yahoo.com"
 */
export const reconstructEmail = (email: string): string => {
  if (!email || typeof email !== "string") return email;
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return email;
  const local = email.substring(0, atIndex);
  const domain = email.substring(atIndex);
  const plusIndex = local.indexOf("+");
  const cleanLocal = plusIndex !== -1 ? local.substring(0, plusIndex) : local;
  return `${cleanLocal}${domain}`;
};