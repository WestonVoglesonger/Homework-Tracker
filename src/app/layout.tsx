import "../styles/globals.css";
import { ReactNode } from "react";
import Head from "next/head";
import { Inter } from "next/font/google";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <link rel="icon" href="/DueNorth-logo.png" />
        <link rel="apple-touch-icon" href="/DueNorth-logo.png" />
      </Head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


