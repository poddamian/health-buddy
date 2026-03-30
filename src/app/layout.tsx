import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { plPL } from "@clerk/localizations";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Health Buddy — Nie zawiedź swojego przyjaciela",
  description:
    "Aplikacja do budowania zdrowych nawyków z partnerem odpowiedzialności. Znajdź swojego Buddy i razem osiągajcie cele zdrowotne.",
  keywords:
    "nawyki, zdrowie, motywacja, accountability, partner, fitness",
  openGraph: {
    title: "Health Buddy",
    description: "Buduj nawyki razem z przyjacielem",
    url: "https://yourdomain.com",
    siteName: "Health Buddy",
    locale: "pl_PL",
    type: "website",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/" localization={plPL}>
      <html lang="pl" className={inter.variable}>
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
