export type Category = "Technology" | "Business" | "Networking" | "Entertainment";

export interface EventItem {
  id: string;
  title: string;
  category: Category;
  date: string; // ISO
  time: string;
  venue: string;
  priceCzk: number;
  description: string;
  organizer: string;
  agenda: string[];
  image: string;
  capacity: number;
  registered: number;
}

export const formatPrice = (priceCzk: number) => (priceCzk === 0 ? "Free" : `${priceCzk} Kč`);

export const spotsLeft = (e: EventItem) => e.capacity - e.registered;

export const categories = ["All", "Technology", "Business", "Networking", "Entertainment"] as const;

export const formatDate = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return {
    day: d.toLocaleDateString("en-GB", { day: "2-digit" }),
    month: d.toLocaleDateString("en-GB", { month: "short" }),
    full: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  };
};
