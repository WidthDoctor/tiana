export type MenuSection = "primary" | "secondary";

export interface MenuContentBlock {
  title: string;
  text?: string;
  items?: string[];
  ordered?: boolean;
}

export interface MenuContentItem {
  id: string;
  label: string;
  menuSection: MenuSection;
  contentTitle: string;
  contentText: string;
  imageSrc: string;
  contentBlocks?: MenuContentBlock[];
}
