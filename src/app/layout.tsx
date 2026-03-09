import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { brandDescription, brandKeywords, brandName, siteUrl } from "./seo";

export const metadata: Metadata = {
  title: {
    default: `${brandName} — индивидуальный пошив свадебных платьев`,
    template: `%s | ${brandName}`,
  },
  description: brandDescription,
  keywords: brandKeywords,
  authors: [{ name: "WidthDoctor" }],
  creator: brandName,
  publisher: brandName,
  applicationName: brandName,
  category: "fashion",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      "ru-RU": "/",
    },
  },
  openGraph: {
    title: `${brandName} — индивидуальный пошив свадебных платьев`,
    description:
      "Ателье свадебной моды: от эскиза до финальной посадки. Запись на консультацию и примерку.",
    url: "/",
    siteName: brandName,
    images: [
      {
        url: "/images/homeSlider/1.png",
        width: 1200,
        height: 630,
        alt: `${brandName} — индивидуальный пошив свадебных платьев`,
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${brandName} - индивидуальный пошив свадебных платьев в Минске`,
    description:
      "Пошив свадебного платья по индивидуальным меркам: дизайн, сроки и сопровождение в ателье Tiana.",
    images: ["/images/homeSlider/1.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
