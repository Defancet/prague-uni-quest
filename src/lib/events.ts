export type Category = "Technology" | "Business" | "Networking" | "Entertainment";

export interface EventItem {
  id: string;
  title: string;
  category: Category;
  date: string; // ISO
  time: string;
  venue: string;
  price: string;
  description: string;
  organizer: string;
  agenda: [string, string, string];
  image: string;
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

export const events: EventItem[] = [
  {
    id: "ai-hackathon",
    title: "AI Hack Night: Build in 12 Hours",
    category: "Technology",
    date: "2026-11-06",
    time: "18:00 – 06:00",
    venue: "ČVUT FIT, Dejvice",
    price: "Free",
    description: "Team up with students from across Prague to prototype AI-powered tools overnight. Mentors, pizza and prizes included.",
    organizer: "ČVUT Student Union",
    agenda: ["Kick-off & team forming", "Mentor check-ins at midnight", "Demo pitches & awards"],
    image: img("photo-1522071820081-009f0129c71c"),
  },
  {
    id: "startup-pitch",
    title: "Startup Pitch Battle",
    category: "Business",
    date: "2026-11-12",
    time: "17:30 – 20:30",
    venue: "Impact Hub Smíchov",
    price: "150 Kč",
    description: "Ten student founders pitch to real investors. Watch, vote and network with the Prague startup scene.",
    organizer: "Prague Student Founders",
    agenda: ["Founder pitches (5 min each)", "Investor Q&A panel", "Networking drinks"],
    image: img("photo-1475721027785-f74eccf877e2"),
  },
  {
    id: "career-night-vse",
    title: "Career Night: Finance & Consulting",
    category: "Networking",
    date: "2026-11-18",
    time: "18:00 – 21:00",
    venue: "VŠE, Žižkov — Rajská budova",
    price: "Free",
    description: "Meet recruiters from top consulting firms and banks. Bring your CV — on-the-spot reviews available.",
    organizer: "VŠE Career Centre",
    agenda: ["Company booths open", "CV clinic with recruiters", "Alumni speed-mentoring"],
    image: img("photo-1515187029135-18ee286d815b"),
  },
  {
    id: "umprum-design",
    title: "Design Talks: Future of Visual Culture",
    category: "Technology",
    date: "2026-11-21",
    time: "16:00 – 19:00",
    venue: "UMPRUM, Old Town",
    price: "100 Kč",
    description: "Designers and creative technologists discuss generative tools, typography and the next wave of visual culture.",
    organizer: "UMPRUM Design Collective",
    agenda: ["Keynote: Designing with AI", "Panel: Craft vs. code", "Portfolio walk-through"],
    image: img("photo-1561070791-2526d30994b5"),
  },
  {
    id: "rooftop-party",
    title: "Rooftop Winter Kick-off Party",
    category: "Entertainment",
    date: "2026-11-27",
    time: "20:00 – 02:00",
    venue: "Rooftop bar, Wenceslas Square",
    price: "250 Kč",
    description: "DJs, city views and hot drinks. Celebrate the end of November with students from every faculty.",
    organizer: "Erasmus Student Network Prague",
    agenda: ["Welcome drink & views", "Live DJ sets", "Midnight photo booth"],
    image: img("photo-1514525253161-7a46d19cd819"),
  },
  {
    id: "hybernska-meetup",
    title: "Founders & Researchers Meetup",
    category: "Networking",
    date: "2026-12-02",
    time: "18:30 – 21:00",
    venue: "Kampus Hybernská",
    price: "Free",
    description: "An informal evening connecting PhD researchers with founders looking for deep-tech collaborators.",
    organizer: "Charles University Innovations",
    agenda: ["Lightning talks", "Matchmaking round", "Open networking"],
    image: img("photo-1528605248644-14dd04022da1"),
  },
  {
    id: "cuni-marketing",
    title: "Growth Marketing Workshop",
    category: "Business",
    date: "2026-12-05",
    time: "10:00 – 14:00",
    venue: "Charles University, Karolinum",
    price: "200 Kč",
    description: "Hands-on workshop on campaigns, analytics and social growth with practitioners from Czech scale-ups.",
    organizer: "CUNI Business Club",
    agenda: ["Funnels & metrics 101", "Live campaign teardown", "Build your own growth plan"],
    image: img("photo-1552664730-d307ca884978"),
  },
  {
    id: "cvut-robotics",
    title: "Robotics Open Lab",
    category: "Technology",
    date: "2026-12-10",
    time: "15:00 – 18:00",
    venue: "CIIRC ČVUT, Dejvice",
    price: "Free",
    description: "Tour the robotics labs, try industrial cobots and meet research teams looking for student assistants.",
    organizer: "CIIRC ČVUT",
    agenda: ["Guided lab tour", "Hands-on cobot demo", "Meet the research teams"],
    image: img("photo-1485827404703-89b55fcc595e"),
  },
  {
    id: "christmas-quiz",
    title: "Christmas Pub Quiz Night",
    category: "Entertainment",
    date: "2026-12-16",
    time: "19:00 – 23:00",
    venue: "Klub Mlejn, Stodůlky",
    price: "80 Kč",
    description: "Form a team of up to six and battle it out across trivia, music and Prague-themed rounds. Festive prizes!",
    organizer: "VŠE Student Club",
    agenda: ["Team registration", "Five quiz rounds", "Awards & mulled wine"],
    image: img("photo-1543007630-9710e4a00a20"),
  },
];

export const categories = ["All", "Technology", "Business", "Networking", "Entertainment"] as const;

export const formatDate = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return {
    day: d.toLocaleDateString("en-GB", { day: "2-digit" }),
    month: d.toLocaleDateString("en-GB", { month: "short" }),
    full: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  };
};
