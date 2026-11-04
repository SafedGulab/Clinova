import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Clinova", description: "Clinic appointment and intake system" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
