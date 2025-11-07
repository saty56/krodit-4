"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthLoadingOverlay } from "@/components/auth-loading-overlay";

interface Props {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Wrapper component that redirects authenticated users away from auth pages
 * Shows loading states to prevent page blink during auth checks
 */
export default function RedirectIfAuth({ children, redirectTo = "/" }: Props) {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (!isPending && data?.user) {
      router.replace(redirectTo);
    }
  }, [isPending, data?.user, router, redirectTo]);

  // Show loading while checking session
  if (isPending) {
    return <AuthLoadingOverlay message="Loading..." fullScreen />;
  }

  // Show redirecting message if user is authenticated
  if (data?.user) {
    return <AuthLoadingOverlay message="Redirecting..." fullScreen />;
  }

  // User is not authenticated, show the auth page
  return <>{children}</>;
}


