/**
 * Formatting utilities for currency and dates
 * Shared utilities to avoid code duplication
 */

/**
 * Format currency amount with fallback
 * Handles both string and number inputs
 */
export function formatCurrency(
  amount: string | number,
  currency: string = "USD"
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `${currency} 0.00`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(numAmount);
  } catch {
    return `${currency} ${numAmount.toFixed(2)}`;
  }
}

/**
 * Format date for display
 * Returns formatted date string or "-" if invalid
 */
export function formatDate(
  date: Date | string | null | undefined
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

/**
 * Format date for display with "Today" and "Tomorrow" labels
 * Returns formatted date string with relative labels
 */
export function formatDateDisplay(
  date: Date | string | null | undefined
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const dateStr = d.toLocaleDateString();
  const todayStr = today.toLocaleDateString();
  const tomorrowStr = tomorrow.toLocaleDateString();
  
  if (dateStr === todayStr) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";
  
  return dateStr;
}

/**
 * Get days until a date
 * Returns number of days or null if invalid
 */
export function getDaysUntil(
  date: Date | string | null | undefined
): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(d);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

