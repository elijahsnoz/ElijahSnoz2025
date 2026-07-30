import type { Metadata } from "next";

const TITLE = "Free AI Stem Splitter — Split Vocals, Drums & Bass Online | Elijah Snoz";
const DESCRIPTION =
  "Free AI stem splitter from Elijah Snoz. Upload any song and instantly separate vocals, drums, bass, and instrumentals in your browser — no signup, no cost. Free AI mastering coming soon.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AI Music Lab — Free Stem Splitter",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any (Web Browser)",
  description: DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Person",
    name: "Elijah Snoz",
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
