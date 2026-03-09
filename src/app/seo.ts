const DEFAULT_SITE_URL = "https://tiana-app.com";

function normalizeSiteUrl(url: string): string {
  const parsed = new URL(url);
  return parsed.origin;
}

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
);

export const brandName = "Tiana";
export const brandDescription =
  "Индивидуальный пошив свадебных платьев в Минске: дизайн, примерки, сроки и сопровождение от ателье Tiana.";
export const brandKeywords = [
  "свадебное платье на заказ",
  "ателье минск",
  "индивидуальный пошив",
  "пошив свадебного платья",
  "Tiana atelier",
];
