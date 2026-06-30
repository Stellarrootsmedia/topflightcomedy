/* ============================================================
   SHOW DATA — edit this file to manage your lineup.
   ------------------------------------------------------------
   To add a show: copy a {...} block and update the fields.
   To sell tickets: create a Stripe Payment Link for each tier
   (https://dashboard.stripe.com/payment-links) and paste the
   URL into "checkoutUrl". Enable "adjustable quantity" on the
   link so guests can buy multiple. If you leave checkoutUrl
   empty, the button falls back to your Linktree.

   status options: "onsale" | "few" | "soldout"
   Dates use ISO format: "YYYY-MM-DDTHH:MM" (24h, local Austin time)
   ============================================================ */

window.TFC_SHOWS = [
  {
    id: "east-austin-showcase-jul",
    title: "Top Flight Showcase",
    type: "showcase",                 // showcase | corporate | special
    date: "2026-07-11T20:00",
    doors: "7:30 PM",
    venue: "The Hangar — East Austin",
    address: "East Austin, TX",
    city: "Austin, TX",
    image: "assets/hero.jpg",
    blurb: "A fresh lineup of Austin's funniest comics and a surprise touring headliner. Sharp sets, premium vibes, zero filler.",
    status: "few",
    fromPrice: 20,
    tiers: [
      { name: "General Admission", note: "Open seating", price: 20, checkoutUrl: "" },
      { name: "VIP — Front Row", note: "Reserved seats + early entry", price: 35, checkoutUrl: "" }
    ]
  },
  {
    id: "speakeasy-night-jul",
    title: "Private Speakeasy Night",
    type: "special",
    date: "2026-07-18T21:00",
    doors: "8:30 PM",
    venue: "Undisclosed — East Austin",
    address: "Secret location revealed 24h before",
    city: "Austin, TX",
    image: "assets/hero.jpg",
    blurb: "An intimate, low-lit room. One mic, killer comics, and a crowd in on the secret. Limited capacity.",
    status: "onsale",
    fromPrice: 30,
    tiers: [
      { name: "General Admission", note: "Limited capacity", price: 30, checkoutUrl: "" }
    ]
  },
  {
    id: "headliner-weekend-jul",
    title: "Headliner Weekend",
    type: "showcase",
    date: "2026-07-25T20:00",
    doors: "7:30 PM",
    venue: "Downtown Austin Stage",
    address: "Downtown Austin, TX",
    city: "Austin, TX",
    image: "assets/hero.jpg",
    blurb: "A nationally touring headliner with credits on Netflix and Comedy Central, supported by Austin's best openers.",
    status: "onsale",
    fromPrice: 25,
    tiers: [
      { name: "General Admission", note: "Open seating", price: 25, checkoutUrl: "" },
      { name: "VIP — Reserved", note: "Premium reserved seating", price: 45, checkoutUrl: "" }
    ]
  },
  {
    id: "corporate-info",
    title: "Corporate Comedy Event",
    type: "corporate",
    date: "2026-08-08T19:00",
    doors: "On request",
    venue: "Your venue or ours",
    address: "Austin & nationwide",
    city: "Austin, TX",
    image: "assets/hero.jpg",
    blurb: "Custom, clean-or-edgy lineups for company parties, conferences and off-sites. Fully produced — you just enjoy the show.",
    status: "onsale",
    fromPrice: 0,            // 0 => shows "Get a Quote" instead of price
    tiers: [
      { name: "Custom Booking", note: "Tailored to your event", price: 0, checkoutUrl: "" }
    ]
  }
];
