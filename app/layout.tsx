import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeBook – Your online phone book",
  description:
    "SafeBook keeps a safe copy of your phone contacts online. Phone spoiled or lost? Get any number from any phone.",
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
