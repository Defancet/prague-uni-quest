# Prague Uni Quest

Build "Student Event Hub" — a static, responsive website to discover university and student events in Prague. NO database, NO login, mock data only (hardcoded array in the code). Sections: (1) Sticky header with logo "Student Event Hub", nav links (Events, How it works) and a CTA button "Explore events". (2) Hero with a Prague evening background image, headline "Your next great story starts at an event.", short intro about workshops, meetups, career nights and parties across Prague, buttons "Find your event" (scrolls to catalogue) and "How it works", and small stats (number of events, 4 categories, Prague-wide). (3) Event catalogue with at least 9 realistic sample events at real Prague university venues (VŠE Žižkov, ČVUT Dejvice, Charles University, UMPRUM, Impact Hub Smíchov, Kampus Hybernská, rooftop bars etc.) in Nov–Dec 2026; each event has title, category, date, time, venue, price (Free or in Kč), short description, organizer, 3-point agenda and an image. (4) Filter chips All / Technology / Business / Networking / Entertainment plus a search box filtering by title or venue, with a friendly empty state when nothing matches. (5) Responsive card grid (1 col mobile, 2 tablet, 3 desktop): image with category tag and date badge, title, time, venue, price and "View details". Clicking opens a detail dialog with full info, agenda, organizer and a mock "Register" button that shows a toast "You're on the list!". (6) "How it works" section: Discover → Choose → Show up. (7) Footer. Style: clean, modern, professional, blue accent color, rounded cards with soft shadows, subtle hover lift, mobile-first, accessible contrast.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://prague-uni-quest.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/53f2ae69-65d9-4781-be80-3ff532a3915f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
