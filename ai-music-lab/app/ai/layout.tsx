import type { Metadata } from "next";

const PAGE_URL = "https://elijahsnoz.me/ai";

const TITLE = "Free AI Music Studio — Stem Splitter, Mastering & Vocal Tuning | Elijah Snoz";
const DESCRIPTION =
  "A free AI music studio from Elijah Snoz. Split any song into vocals, drums, bass and instrumentals, then master it to streaming loudness and pitch-correct the vocal — all in your browser, no signup, no cost.";

export const metadata: Metadata = {
  metadataBase: new URL("https://elijahsnoz.me"),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "free AI music studio",
    "AI stem splitter",
    "split song into stems",
    "free AI mastering online",
    "AI vocal tuning",
    "autotune online free",
    "separate vocals from song",
    "acapella extractor",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "Elijah Snoz AI Music Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@elijahsnoz",
    creator: "@elijahsnoz",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Elijah Snoz AI Music Lab",
  url: PAGE_URL,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any (Web Browser)",
  description: DESCRIPTION,
  // Keep in sync with the three tools rendered in app/ai/page.tsx.
  featureList: [
    "AI stem separation into vocals, drums, bass and instrumentals",
    "AI mastering to gentle, balanced or loud streaming targets",
    "AI vocal pitch correction, chromatic or to a chosen key",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Person",
    name: "Elijah Snoz",
    alternateName: "Ajayi VII",
    url: "https://elijahsnoz.me",
  },
};

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      {children}
    </>
  );
}
