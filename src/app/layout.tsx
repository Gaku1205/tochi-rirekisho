import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost, Murecho, Shippori_Mincho_B1 } from "next/font/google";
import Reveal from "@/components/Reveal";
import "./globals.css";

const name = Shippori_Mincho_B1({ weight: "800", subsets: ["latin"], variable: "--f-name", display: "swap" });
const year = Bodoni_Moda({ subsets: ["latin"], axes: ["opsz"], variable: "--f-year", display: "swap" });
const jost = Jost({ weight: ["400", "500"], subsets: ["latin"], variable: "--f-jost", display: "swap" });
const murecho = Murecho({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--f-jp", display: "swap" });

export const metadata: Metadata = {
  title: { default: "土地の履歴書｜福岡市", template: "%s｜土地の履歴書" },
  description:
    "福岡市の住所を入れると、古い地形図と空中写真、浸水・地盤・地価の公開データから、その土地の昔と災害リスクをAIが読み解いて1枚の履歴書にします。",
};

export const viewport: Viewport = { themeColor: "#DDD6C6" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${name.variable} ${year.variable} ${jost.variable} ${murecho.variable}`}>
      <body>
        {children}
        <Reveal />
      </body>
    </html>
  );
}
