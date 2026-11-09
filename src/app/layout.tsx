import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Mono, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dmmono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Gharmatch: rentals in Ahmedabad and Gandhinagar", template: "%s | Gharmatch" },
  description:
    "Find a rental whose house rules fit how you live. Landlords state their rules, tenants state their needs, no broker fee.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = { themeColor: "#060709" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${bricolage.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <MotionRoot>
          <Header />
          {children}
          <Footer />
        </MotionRoot>
        <Analytics />
      </body>
    </html>
  );
}
