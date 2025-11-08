"use client";

import React from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useSidebar } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Calendar,
  Plus,
  ArrowRight,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { calculateMonthlySpending } from "@/modules/subscriptions/schema";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";

/**
 * Helper function to format currency
 */
function formatCurrency(amount: number, currency: string = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Helper function to format date for display
 */
function formatDateDisplay(date: Date | string | null | undefined): string {
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
 * Get days until billing date
 */
function getDaysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const billingDate = new Date(d);
  billingDate.setHours(0, 0, 0, 0);
  
  const diffTime = billingDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Main home view component
 * Displays dashboard with summary, recent subscriptions, and quick actions
 */
export const HomeView = () => {
  const router = useRouter();
  const trpc = useTRPC();
  
  // Fetch report data for summary
  const { data: reportData } = useSuspenseQuery(trpc.subscriptions.getReport.queryOptions());
  
  // Fetch recent subscriptions (last 5)
  const { data: subscriptionsData } = useSuspenseQuery(
    trpc.subscriptions.listMany.queryOptions({
      page: 1,
      pageSize: 5,
    })
  );

  const { summary, upcomingBilling } = reportData;
  const recentSubscriptions = subscriptionsData.items;

  // Get upcoming billing (next 7 days)
  const nextWeekBilling = upcomingBilling.filter((item) => {
    if (!item.nextBillingDate) return false;
    const days = getDaysUntil(item.nextBillingDate);
    return days !== null && days >= 0 && days <= 7;
  });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const { state } = useSidebar();

  React.useEffect(() => {
    if (containerRef.current) {
      if (state === "collapsed") {
        containerRef.current.style.paddingLeft = "1rem";
        containerRef.current.style.paddingRight = "1rem";
      } else {
        containerRef.current.style.paddingLeft = "";
        containerRef.current.style.paddingRight = "";
      }
    }
  }, [state]);

  return (
    <div ref={containerRef} className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6 sidebar-page-container">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your subscriptions and spending
          </p>
        </div>
        <Button onClick={() => router.push("/subscriptions")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Subscription
        </Button>
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
              {summary.activeSubscriptions} active
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

        {/* Upcoming Billing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming (7 Days)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nextWeekBilling.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Subscriptions billing soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Subscriptions - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Subscriptions</CardTitle>
                <CardDescription>Your latest subscription additions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/subscriptions">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No subscriptions yet</p>
                  <p className="text-sm mt-1">Get started by adding your first subscription</p>
                  <Button
                    className="mt-4"
                    onClick={() => router.push("/subscriptions")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subscription
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSubscriptions.map((subscription) => {
                    const monthly = calculateMonthlySpending(
                      subscription.amount || "0",
                      subscription.billingCycle || "monthly"
                    );
                    
                    return (
                      <div
                        key={subscription.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/subscriptions/${subscription.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{subscription.name}</p>
                            <Badge
                              variant={subscription.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {subscription.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>
                              {formatCurrency(
                                parseFloat(subscription.amount || "0"),
                                subscription.currency || "USD"
                              )}
                            </span>
                            <span>•</span>
                            <span>
                              {subscription.billingCycle?.replace(/_/g, " ") || "monthly"}
                            </span>
                            <span>•</span>
                            <span>
                              {formatCurrency(monthly, subscription.currency || "USD")}/mo
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Billing & Quick Actions - Takes 1 column */}
        <div className="space-y-6">
          {/* Upcoming Billing */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Billing</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/report">
                  <FileText className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {nextWeekBilling.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming bills</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nextWeekBilling.map((item) => {
                    const days = getDaysUntil(item.nextBillingDate);
                    const isUrgent = days !== null && days <= 3;
                    
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDateDisplay(item.nextBillingDate)}
                            </span>
                            {days !== null && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className={`text-xs ${isUrgent ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                                  {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatCurrency(
                              parseFloat(item.amount || "0"),
                              item.currency || "USD"
                            )}
                          </p>
                          {isUrgent && (
                            <AlertCircle className="h-3 w-3 text-orange-600 mt-1 mx-auto" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/subscriptions")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Subscription
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/subscriptions">
                  <CreditCard className="mr-2 h-4 w-4" />
                  View All Subscriptions
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/report">
                  <FileText className="mr-2 h-4 w-4" />
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Summary */}
      {reportData.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Monthly spending breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {reportData.categoryBreakdown
                .sort((a, b) => b.monthly - a.monthly)
                .slice(0, 6)
                .map((item) => (
                  <div
                    key={item.category}
                    className="flex flex-col items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-center mb-1">
                      {item.category}
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(item.monthly, "USD")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.count} {item.count === 1 ? "subscription" : "subscriptions"}
                    </p>
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
 * Loading state component for home view
 * Used by React Suspense boundary
 */
export const HomeViewLoading = () => {
  return (
    <LoadingState 
      title="Loading Dashboard" 
      description="Fetching your subscription data..." 
    />
  );
};

/**
 * Error state component for home view
 * Used by React Error Boundary
 */
export const HomeViewError = ({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) => {
  return (
    <ErrorState 
      title="Error loading dashboard"
      description="Failed to load your subscription data. Please try again."
    />
  );
};
