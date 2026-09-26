import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NWIS — Nearby Wells Intelligence System | Oil India Limited",
  description:
    "eRTMAC Real-Time Monitoring & Analytics Centre — SIH26121. Live telemetry, 3D trajectory explorer, lookahead hazard advisory, and historical drilling intelligence for Oil India Limited.",
  keywords: ["NWIS", "eRTMAC", "Oil India", "drilling", "telemetry", "SIH2024"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
