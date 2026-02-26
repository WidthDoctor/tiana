import localFont from "next/font/local";
import {
  Bad_Script,
  Cormorant_Garamond,
  Zen_Kaku_Gothic_New,
} from "next/font/google";

export const badScript = Bad_Script({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  display: "swap",
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: "300",
  display: "swap",
});
export const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const erasLight = localFont({
  src: [
    {
      path: "./fonts/eras-light.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  preload: true,
});
