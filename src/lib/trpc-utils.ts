"use client";

import type { AppRouter } from "@/trpc/routers/_app";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

let clientInstance: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

function getTrpcClient() {
  if (typeof window === "undefined") {
    // Server-side: create new client each time
    return createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    });
  }
  
  // Client-side: use singleton
  if (!clientInstance) {
    clientInstance = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    });
  }
  
  return clientInstance;
}

export const trpcUtils = {
  get client() {
    return getTrpcClient();
  },
};

