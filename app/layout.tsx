import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S&F Studios",
  description: "The official S&F Studios portal for services, talent, updates, socials, and profiles.",
  openGraph: {
    title: "S&F Studios",
    description: "Services, showcase slots, talent jobs, updates, socials, and profiles from S&F Studios.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
