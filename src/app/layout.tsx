import "../styles/globals.css";
import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "DueNorth",
    template: "%s • DueNorth",
  },
  icons: {
    icon: "/DueNorth-logo.png",
    shortcut: "/DueNorth-logo.png",
    apple: "/DueNorth-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


