import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "TaskFlow", template: "%s · TaskFlow" },
  description: "Proste zarządzanie projektami i zadaniami dla małych zespołów.",
  icons: {
    icon: [
      { url: "/branding/taskflow-v1.1/taskflow-app-icon.svg", type: "image/svg+xml" },
      { url: "/branding/taskflow-v1.1/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/branding/taskflow-v1.1/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/branding/taskflow-v1.1/taskflow-app-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
