import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.ico",
  },
  title: "LinkShorty - Shorten links to enhance online sharing",
  description: "Our link shortener compacts long URLs for easy sharing across platforms, with click tracking, custom aliases, audience insights, and seamless integration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lexend.variable}>
      <body className={`${lexend.className} font-sans antialiased bg-[#f8fafc] text-slate-900 selection:bg-indigo-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}

