export type AccessoryItem = {
  id: string;
  title: string;
  price: string;
  images: string[];
};

export type AccessoryCategory = {
  id: string;
  title: string;
  description: string;
  cover: string;
  items: AccessoryItem[];
};
