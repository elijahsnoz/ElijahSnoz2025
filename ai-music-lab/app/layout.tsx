import type { Metadata } from "next";
import { Inter, Space_Grotesk, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-body", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const orbitron = Orbitron({ variable: "--font-mono", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: "AI Music Lab (Beta) | Elijah Snoz",
  description: "Elijah Snoz's personal AI music production laboratory.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${orbitron.variable} h-full antialiased`}>
      <body className="min-h-full bg-void font-body text-text">{children}</body>
    </html>
  );
}
