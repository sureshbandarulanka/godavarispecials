/**
 * Global Utility for Schedule Automation
 * 
 * Determines if a Product, Offer, or Banner should be visible to users 
 * based on its active status and optional scheduling dates.
 */

const parseDate = (date: any): Date | null => {
  if (!date) return null;

  // Handle Firestore Timestamp
  if (typeof date.toDate === 'function') {
    return date.toDate();
  }

  // Handle ISO string or standard date input
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Returns true if the item is active and falls within its scheduled time window.
 */
export const isActiveBySchedule = (item: any): boolean => {
  const now = new Date();

  // 1. Core check: Must be marked as active
  if (item.isActive === false) return false;

  // 2. Schedule check: Start Date
  const start = parseDate(item.startDate);
  if (start && start > now) return false;

  // 3. Schedule check: End Date
  const end = parseDate(item.endDate);
  if (end && end < now) return false;

  // 4. Fallback: If both null or dates are valid, the item is active
  return true;
};
