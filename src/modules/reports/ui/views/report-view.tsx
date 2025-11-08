"use client";

import React from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  FileText,
  FileJson
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  exportToCSV, 
  exportToJSON, 
  downloadFile, 
  prepareSubscriptionForExport,
  type ExportSummary 
} from "@/lib/export-utils";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format-utils";

/**
 * Colors for charts
 */
const CHART_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#a4de6c",
];

/**
 * Main report view component
 * Displays subscription analytics, spending breakdown, and insights
 */
export const ReportView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(trpc.subscriptions.getReport.queryOptions());
  const [isExporting, setIsExporting] = React.useState(false);

  const { summary, categoryBreakdown, upcomingBilling, billingCycleDistribution } = data;

  /**
   * Handle export functionality
   */
  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true);
      
      // Fetch all subscriptions for export using queryClient
      const allSubscriptions = await queryClient.fetchQuery(
        trpc.subscriptions.getAllForExport.queryOptions()
      );
      
      // Prepare export data
      const exportSubscriptions = allSubscriptions.map(prepareSubscriptionForExport);
      
      const exportSummary: ExportSummary = {
        totalSubscriptions: summary.totalSubscriptions,
        activeSubscriptions: summary.activeSubscriptions,
        totalMonthlySpending: summary.totalMonthlySpending,
        totalYearlySpending: summary.totalYearlySpending,
        exportDate: new Date().toISOString(),
      };

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `subscriptions-export-${timestamp}`;

      if (format === "csv") {
        const csvContent = exportToCSV(exportSubscriptions, exportSummary);
        downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
        toast.success("Subscription data exported to CSV");
      } else if (format === "json") {
        const jsonContent = exportToJSON(exportSubscriptions, exportSummary);
        downloadFile(jsonContent, `${filename}.json`, "application/json");
        toast.success("Subscription data exported to JSON");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export subscription data");
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare data for pie chart (category breakdown)
  const pieChartData = categoryBreakdown.map((item, index) => ({
    name: item.category,
    value: item.monthly,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // Prepare data for bar chart (billing cycle distribution)
  const barChartData = Object.entries(billingCycleDistribution).map(([cycle, count]) => ({
    cycle: cycle.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }));

  return (
    <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6 sidebar-page-container">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Report</h1>
          <p className="text-muted-foreground mt-1">
            Analytics and insights for your subscriptions
          </p>
        </div>
        
        {/* Export Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" disabled={isExporting} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => handleExport("csv")}
              disabled={isExporting}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport("json")}
              disabled={isExporting}
            >
              <FileJson className="mr-2 h-4 w-4" />
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Spending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalMonthlySpending, "USD")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(summary.totalYearlySpending, "USD")} per year
            </p>
          </CardContent>
        </Card>

        {/* Total Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.activeSubscriptions} active, {summary.inactiveSubscriptions} inactive
            </p>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.inactiveSubscriptions} cancelled
            </p>
          </CardContent>
        </Card>

        {/* Auto Renew */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Renew</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.autoRenewCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.manualRenewCount} manual renewal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Monthly spending distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value, "USD")} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Cycle Distribution - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Cycle Distribution</CardTitle>
            <CardDescription>Number of subscriptions by billing cycle</CardDescription>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cycle" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Detailed spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Monthly</th>
                    <th className="text-right p-2">Yearly</th>
                    <th className="text-right p-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((item) => (
                    <tr key={item.category} className="border-b">
                      <td className="p-2 font-medium">{item.category}</td>
                      <td className="p-2 text-right">{formatCurrency(item.monthly, "USD")}</td>
                      <td className="p-2 text-right">{formatCurrency(item.yearly, "USD")}</td>
                      <td className="p-2 text-right">
                        <Badge variant="outline">{item.count}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold border-t-2">
                    <td className="p-2">Total</td>
                    <td className="p-2 text-right">
                      {formatCurrency(summary.totalMonthlySpending, "USD")}
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(summary.totalYearlySpending, "USD")}
                    </td>
                    <td className="p-2 text-right">
                      <Badge>{summary.activeSubscriptions}</Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No subscriptions found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Billing Dates */}
      {upcomingBilling.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Billing (Next 30 Days)
            </CardTitle>
            <CardDescription>Subscriptions with billing dates in the next month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingBilling.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(item.nextBillingDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(item.amount || "0", item.currency || "USD")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * Loading state component for report view
 */
export const ReportViewLoading = () => {
  return (
    <LoadingState 
      title="Loading Report" 
      description="Generating your subscription analytics..." 
    />
  );
};

/**
 * Error state component for report view
 */
export const ReportViewError = ({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) => {
  return (
    <ErrorState 
      title="Error loading report"
      description="Failed to load subscription analytics. Please try again."
    />
  );
};

