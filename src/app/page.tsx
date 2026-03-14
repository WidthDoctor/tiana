import type { Metadata } from "next";
import { Suspense } from "react";
import Home from "../components/screens/Home/Home";
import { getAccessoryCategoriesFromPublic } from "../lib/accessories";
import { getFaqItemsFromPublic } from "../lib/faq";
import { getJournalPostsFromPublic } from "../lib/journal";
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
  const [portfolioBrides, journalPosts, accessoryCategories, faqItems] =
    await Promise.all([
      getPortfolioBrides(),
      getJournalPostsFromPublic(),
      getAccessoryCategoriesFromPublic(),
      getFaqItemsFromPublic(),
    ]);

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
        <Home
          portfolioBrides={portfolioBrides}
          journalPosts={journalPosts}
          accessoryCategories={accessoryCategories}
          faqItems={faqItems}
        />
      </Suspense>
    </>
  );
}
