/**
 * ADMIN_WHITELIST
 * 
 * Only phone numbers in this list are authorized to:
 * 1. Receive Admin OTP
 * 2. Access the Admin Dashboard
 * 
 * Format: "+91XXXXXXXXXX" (Include country code)
 */
export const ADMIN_WHITELIST = [
  "+919876543210", // Example number (User should replace this)
  "+918180401700", // Example based on Rajahmundry coordinates/context
  "+917013233210", // Added for verification
  "+919491559901", // New authorized admin
];

/**
 * Normalizes phone numbers to E.164 format (+91XXXXXXXXXX)
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return "";
  // Remove all non-numeric characters except '+'
  let normalized = phone.replace(/[^\d+]/g, "");
  
  // Ensure it starts with +91 if it's a 10-digit number
  if (normalized.length === 10) {
    normalized = "+91" + normalized;
  } else if (normalized.length === 12 && normalized.startsWith("91")) {
    normalized = "+" + normalized;
  }
  
  return normalized;
};

/**
 * Checks if a phone number is authorized as an admin
 * @param phoneNumber Formatted or raw phone number
 */
export const isWhitelistedAdmin = (phoneNumber: string): boolean => {
  const formatted = formatPhone(phoneNumber);
  return ADMIN_WHITELIST.includes(formatted);
};
