import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Public_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans" });

export const metadata: Metadata = {
  title: "Jonas Lavagem",
  description: "Controle de serviços de lavagem de veículos",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Jonas Lavagem" },
};

export const viewport: Viewport = {
  themeColor: "#376386",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${manrope.variable} ${publicSans.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-surface-container font-body antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
