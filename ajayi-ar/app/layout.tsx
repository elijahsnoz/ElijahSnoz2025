import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});
const inter = Inter({ variable: "--font-body", subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://elijahsnoz.me"),
  title: {
    default: "AJAYI VII — Living Paintings",
    template: "AJAYI VII — Living Paintings | %s",
  },
  description:
    "Experience an AJAYI VII painting through an interactive augmented reality artwork — point your phone at the physical piece and watch it come alive.",
  openGraph: {
    siteName: "AJAYI VII — Living Paintings",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper font-body text-ink">{children}</body>
    </html>
  );
}
