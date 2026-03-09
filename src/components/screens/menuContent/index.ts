import { appointmentContent } from "./appointment/content";
import { atelierContent } from "./atelier/content";
import { deferredStartContent } from "./deferred-start/content";
import { designContent } from "./design/content";
import { faqContent } from "./faq/content";
import { packagingContent } from "./packaging/content";
import { pricingContent } from "./pricing/content";
import { processContent } from "./process/content";
import { timelineContent } from "./timeline/content";
import { toneOfVoiceContent } from "./tone-of-voice/content";

export type { MenuContentItem, MenuSection } from "./types";

export const MENU_CONTENT_ITEMS = [
  processContent,
  pricingContent,
  timelineContent,
  deferredStartContent,
  packagingContent,
  designContent,
  toneOfVoiceContent,
  atelierContent,
  appointmentContent,
  faqContent,
];
