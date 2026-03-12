export type JournalPostSection = {
  heading: string;
  text: string;
};

export type JournalPost = {
  id: string;
  title: string;
  excerpt: string;
  cover: string;
  images?: string[];
  sections: JournalPostSection[];
};
