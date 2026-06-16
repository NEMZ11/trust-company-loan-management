import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trust Company Loan Management",
  description: "Internal loan management dashboard for Trust Company"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
