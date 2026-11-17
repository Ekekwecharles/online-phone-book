import type { Metadata, Viewport } from "next";
import { APP_DESCRIPTION, APP_TITLE } from "@phonebook/shared";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: APP_TITLE, template: "%s | Phone Book" },
  description: APP_DESCRIPTION,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-lg leading-relaxed">{children}</body>
    </html>
  );
}
