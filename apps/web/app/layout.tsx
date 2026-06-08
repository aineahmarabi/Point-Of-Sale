import type { Metadata } from "next";
import { Toaster } from "sonner";
import { kumbhSans, poltawskiSerif, geistMono } from "@repo/assets/fonts";
import { AuthProvider } from "@repo/auth/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ethereal Dayo",
  description: "Ethereal Dayo Gift Shop — Point of Sale",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${kumbhSans.variable} ${poltawskiSerif.variable} ${geistMono.variable} h-full overflow-hidden`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
