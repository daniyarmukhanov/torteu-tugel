import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ТӨРТЕУ ТҮГЕЛ",
  description: "Төрт сөзден тұратын төрт санатқа бөліңіз",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="044d5bfa-722d-4029-9a05-b399ea05c59b"
        ></script>
        <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "8d083e2d79594a0491d193d71e02fda8"}'></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
