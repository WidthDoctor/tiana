import type { Metadata } from "next";
import { Suspense } from "react";
import Home from "../components/screens/Home/Home";
import { getPortfolioBrides } from "../lib/portfolio";
import { brandDescription, brandName, siteUrl } from "./seo";

export function generateMetadata(): Metadata {
  return {
    title: "Главная",
    description: brandDescription,
    alternates: {
      canonical: "/",
    },
  };
}

export default async function Page() {
  const portfolioBrides = await getPortfolioBrides();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: brandName,
        url: siteUrl,
        description: brandDescription,
        logo: `${siteUrl}/images/homeSlider/1.png`,
      },
      {
        "@type": "WebSite",
        name: brandName,
        url: siteUrl,
        inLanguage: "ru-RU",
        description: brandDescription,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <Home portfolioBrides={portfolioBrides} />
      </Suspense>
    </>
  );
}
