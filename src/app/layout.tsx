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
      { url: "/favicon.ico?v=4" },
      { url: "/favicon-16x16.png?v=4", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/file.svg", type: "image/svg+xml", sizes: "any" }
    ],
    shortcut: [
      { url: "/favicon-32x32.png?v=4", type: "image/png" }
    ],
    apple: [
      { url: "/file%20(1).png?v=4", type: "image/png" }
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
