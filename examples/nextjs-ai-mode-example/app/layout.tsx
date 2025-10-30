import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AIProvider, AIMode } from "@warpy-auth-sdk/core/ai-mode";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlightSearch AI - Find Your Perfect Flight",
  description: "AI-powered flight search with MCP integration. Search, track, and book flights with intelligent assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AIProvider
          enabled={false}
          mcpEndpoint="/api/mcp"
          position="bottom"
          theme="auto"
          showNotifications={true}
          showRainbowBorder={true}
        >
          <AIMode />
          {children}
        </AIProvider>
      </body>
    </html>
  );
}
