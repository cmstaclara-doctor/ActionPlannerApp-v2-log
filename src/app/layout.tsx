import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ActionPlanning App · LEAP 99 v2.0",
  description: "ActionPlanning App by Doc Kalodski — LEAP 99 v2.0, set your 3 goals for 8 weeks",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,   // prevent pinch-zoom on iOS (keeps layout stable)
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
