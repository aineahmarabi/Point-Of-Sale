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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${kumbhSans.variable} ${poltawskiSerif.variable} ${geistMono.variable}`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
