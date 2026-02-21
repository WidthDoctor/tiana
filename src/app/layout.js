import "./globals.css";

export const metadata = {
  title: "Tiana - Добро пожаловать в Next.js",
  description:
    "Это главная страница приложения Tiana, созданного с помощью Next.js. Откройте для себя современные веб-технологии.",
  keywords: "Next.js, React, веб-разработка, Tiana, приложение",
  authors: [{ name: "WidthDoctor" }],
  creator: "WidthDoctor",
  publisher: "WidthDoctor",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://tiana-app.com"), // Замените на ваш домен
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tiana - Добро пожаловать в Next.js",
    description:
      "Это главная страница приложения Tiana, созданного с помощью Next.js.",
    url: "https://tiana-app.com",
    siteName: "Tiana",
    images: [
      {
        url: "https://tiana-app.com/og-image.jpg", // Замените на реальное изображение
        width: 1200,
        height: 630,
        alt: "Tiana App",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiana - индивидуальный пошив свадебных платьев в Минске",
    description:
      "Это главная страница приложения Tiana, созданного с помощью Next.js.",
    images: ["https://tiana-app.com/twitter-image.jpg"], // Замените на реальное изображение
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
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
    google: "your-google-site-verification-code", // Замените на реальный код
    yandex: "your-yandex-verification-code", // Замените на реальный код
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
