import type { Metadata } from "next";
import Home from "../components/screens/Home/Home";
import { MENU_CONTENT_ITEMS } from "../components/screens/Home/menuContentConfig";
import { getPortfolioBrides } from "../lib/portfolio";
import { brandDescription, brandName, siteUrl } from "./seo";

type PageProps = {
  searchParams: Promise<{
    section?: string;
  }>;
};

function getSectionById(sectionId?: string) {
  if (!sectionId) {
    return undefined;
  }

  return MENU_CONTENT_ITEMS.find((item) => item.id === sectionId);
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const section = getSectionById(params.section);

  if (!section) {
    return {
      title: "Главная",
      description: brandDescription,
      alternates: {
        canonical: "/",
      },
    };
  }

  const sectionUrl = new URL(siteUrl);
  sectionUrl.searchParams.set("section", section.id);

  return {
    title: `${section.contentTitle}`,
    description: section.contentText,
    alternates: {
      canonical: sectionUrl.toString(),
    },
    openGraph: {
      title: `${section.contentTitle} — ${brandName}`,
      description: section.contentText,
      url: sectionUrl.toString(),
      images: [
        {
          url: section.imageSrc,
          alt: section.contentTitle,
        },
      ],
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
      <Home portfolioBrides={portfolioBrides} />
    </>
  );
}
