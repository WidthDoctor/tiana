import type { AccessoryCategory } from "./types";

export const DEFAULT_ACCESSORY_CATEGORIES: AccessoryCategory[] = [
  {
    id: "fata",
    title: "Фата",
    description: "Классические и современные варианты длины и объема.",
    cover: "/images/homeSlider/1.png",
    items: [
      {
        id: "fata-soft",
        title: "Фата Soft",
        price: "180 BYN",
        images: ["/images/homeSlider/1.png", "/images/homeSlider/2.jpg"],
      },
      {
        id: "fata-long",
        title: "Фата Long",
        price: "240 BYN",
        images: ["/images/homeSlider/ann(5).jpg"],
      },
    ],
  },
  {
    id: "platki",
    title: "Платочки",
    description: "Акцентные платочки и легкие дополнения к образу.",
    cover: "/images/homeSlider/2.jpg",
    items: [
      {
        id: "silk-handkerchief",
        title: "Silk платочек",
        price: "95 BYN",
        images: ["/images/homeSlider/2.jpg"],
      },
    ],
  },
  {
    id: "bantiki",
    title: "Бантики",
    description: "Минималистичные и объемные банты для прически и платья.",
    cover: "/images/homeSlider/ann(5).jpg",
    items: [
      {
        id: "bow-midi",
        title: "Бантик Midi",
        price: "120 BYN",
        images: ["/images/homeSlider/ann(5).jpg", "/images/homeSlider/1.png"],
      },
    ],
  },
  {
    id: "nakidki",
    title: "Накидки на плечи",
    description: "Легкие накидки для церемонии и вечерней части.",
    cover: "/images/homeSlider/1.png",
    items: [
      {
        id: "cape-air",
        title: "Накидка Air",
        price: "210 BYN",
        images: ["/images/homeSlider/1.png", "/images/homeSlider/2.jpg"],
      },
    ],
  },
];
