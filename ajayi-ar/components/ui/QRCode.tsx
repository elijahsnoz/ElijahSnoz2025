import QRCode from "qrcode";

interface Props {
  url: string;
  size?: number;
  label?: string;
}

/**
 * Server-rendered QR — the point is a stable print-and-forget destination
 * (e.g. https://elijahsnoz.me/ar/aje) beside the physical painting, not a
 * client-side gimmick. Regenerating this component never changes the URL
 * it encodes unless the artwork's slug changes.
 */
export default async function QRCodeImage({ url, size = 220, label }: Props) {
  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: { dark: "#0a0a0c", light: "#fbfaf700" },
  });

  return (
    <figure className="inline-flex flex-col items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} width={size} height={size} alt={`QR code linking to ${url}`} />
      {label && <figcaption className="text-[11px] tracking-[0.2em] text-ink-soft uppercase">{label}</figcaption>}
    </figure>
  );
}
