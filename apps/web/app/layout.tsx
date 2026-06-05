import type { Metadata } from "next";
import { kumbhSans, poltawskiSerif, geistMono } from "@repo/assets/fonts";
import { AuthProvider } from "@repo/auth/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "POS Terminal",
  description: "Point of sale terminal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${kumbhSans.variable} ${poltawskiSerif.variable} ${geistMono.variable} h-full overflow-x-hidden`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
