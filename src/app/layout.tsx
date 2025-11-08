import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next";

import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "KRODIT - Subscription Manager",
  description: "Manage your subscriptions and track billing dates",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NuqsAdapter>
    <TRPCReactProvider>
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
    </TRPCReactProvider>
    </NuqsAdapter>
  );
}
