"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RequireAuth({ children, redirectTo = "/sign-in" }: RequireAuthProps) {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !data?.user) {
      router.replace(redirectTo);
    }
  }, [isPending, data?.user, router, redirectTo]);

  if (isPending) return null;
  if (!data?.user) return null;
  return <>{children}</>;
}


