/**
 * Export utilities for subscription data
 * Provides functions to export subscription data in various formats (CSV, JSON, Excel)
 */

import { calculateMonthlySpending, calculateYearlySpending } from "@/modules/subscriptions/schema";

/**
 * Subscription data type for export
 */
export interface ExportSubscription {
  id: string;
  name: string;
  category: string;
  amount: string;
  currency: string;
  billingCycle: string;
  monthlyEquivalent: number;
  yearlyEquivalent: number;
  nextBillingDate: string | null;
  serviceUrl: string | null;
  isActive: boolean;
  isAutoRenew: boolean;
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Export summary data
 */
export interface ExportSummary {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalMonthlySpending: number;
  totalYearlySpending: number;
  exportDate: string;
}

/**
 * Convert subscription data to CSV format
 */
export function exportToCSV(
  subscriptions: ExportSubscription[],
  summary: ExportSummary
): string {
  const headers = [
    "Name",
    "Category",
    "Amount",
    "Currency",
    "Billing Cycle",
    "Monthly Equivalent",
    "Yearly Equivalent",
    "Next Billing Date",
    "Service URL",
    "Active",
    "Auto Renew",
    "Instructions",
    "Created At",
    "Updated At",
  ];

  const rows = subscriptions.map((sub) => [
    escapeCSV(sub.name),
    escapeCSV(sub.category),
    sub.amount,
    sub.currency,
    sub.billingCycle,
    sub.monthlyEquivalent.toFixed(2),
    sub.yearlyEquivalent.toFixed(2),
    sub.nextBillingDate || "",
    sub.serviceUrl || "",
    sub.isActive ? "Yes" : "No",
    sub.isAutoRenew ? "Yes" : "No",
    escapeCSV(sub.instructions || ""),
    sub.createdAt,
    sub.updatedAt,
  ]);

  // Add summary section
  const summaryRows = [
    [],
    ["SUMMARY"],
    ["Total Subscriptions", summary.totalSubscriptions.toString()],
    ["Active Subscriptions", summary.activeSubscriptions.toString()],
    ["Total Monthly Spending", summary.totalMonthlySpending.toFixed(2)],
    ["Total Yearly Spending", summary.totalYearlySpending.toFixed(2)],
    ["Export Date", summary.exportDate],
  ];

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
    ...summaryRows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Convert subscription data to JSON format
 */
export function exportToJSON(
  subscriptions: ExportSubscription[],
  summary: ExportSummary
): string {
  const exportData = {
    metadata: {
      exportDate: summary.exportDate,
      version: "1.0",
    },
    summary: {
      totalSubscriptions: summary.totalSubscriptions,
      activeSubscriptions: summary.activeSubscriptions,
      totalMonthlySpending: summary.totalMonthlySpending,
      totalYearlySpending: summary.totalYearlySpending,
    },
    subscriptions,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Download file with given content and filename
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "text/plain"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV field values
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Format datetime for export
 */
export function formatDateTimeForExport(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

/**
 * Prepare subscription data for export
 */
export function prepareSubscriptionForExport(sub: any): ExportSubscription {
  const monthly = calculateMonthlySpending(sub.amount || "0", sub.billingCycle || "monthly");
  const yearly = calculateYearlySpending(sub.amount || "0", sub.billingCycle || "monthly");

  return {
    id: sub.id || "",
    name: sub.name || "",
    category: sub.category || "other",
    amount: sub.amount || "0.00",
    currency: sub.currency || "USD",
    billingCycle: sub.billingCycle || "monthly",
    monthlyEquivalent: monthly,
    yearlyEquivalent: yearly,
    nextBillingDate: formatDateForExport(sub.nextBillingDate),
    serviceUrl: sub.serviceUrl || null,
    isActive: sub.isActive ?? true,
    isAutoRenew: sub.isAutoRenew ?? true,
    instructions: sub.instructions || null,
    createdAt: formatDateTimeForExport(sub.createdAt),
    updatedAt: formatDateTimeForExport(sub.updatedAt),
  };
}

