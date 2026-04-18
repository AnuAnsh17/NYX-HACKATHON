import type { Metadata } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SSEProvider } from "@/providers/SSEProvider";
import { CursorSpotlight } from "@/components/layout/CursorSpotlight";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NYX-DCL — Deep Compliance Layer",
  description:
    "We don't store logs. We store proof. Immutable blockchain-backed audit infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="bg-nyx-black text-nyx-text antialiased font-body min-h-full flex flex-col">
        <SSEProvider>
          <CursorSpotlight />
          <Navbar />
          <div className="pt-14 flex flex-col flex-1">{children}</div>
        </SSEProvider>
      </body>
    </html>
  );
}
