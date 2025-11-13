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
  icons: {
    icon: [
      { url: "/log.png", type: "image/png", sizes: "32x32" },
      { url: "/log.png", type: "image/png", sizes: "16x16" },
      { url: "/log.png", type: "image/png", sizes: "48x48" },
    ],
    shortcut: [
      { url: "/log.png", type: "image/png" },
    ],
    apple: [
      { url: "/log.png", type: "image/png", sizes: "180x180" },
    ],
  },
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
