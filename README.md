# Top Flight Comedy — Website

A fast, modern, SEO- and AI-citation-optimized static site. No build step, no framework — just HTML, CSS, and vanilla JS. Host it anywhere (Netlify, Vercel, Cloudflare Pages, GitHub Pages, or your current host).

Brand: **Gold `#F2B827`** · **Navy `#003F71`** · **Ink `#0C0F14`** · Fonts **Fjalla One** + **Raleway**.

## File map
```
index.html          Single-page site (all sections + structured data)
css/styles.css      Design system (brand colors as CSS variables at the top)
js/shows.js         ← EDIT THIS to manage your shows + ticket links
js/main.js          Rendering, ticket modal, filters, FAQ, newsletter
assets/             logo.png, hero.jpg
robots.txt          Allows Google + AI crawlers (GPTBot, ClaudeBot, Perplexity…)
sitemap.xml         Update lastmod when you change content
llms.txt            Plain-language site summary for AI answer engines
site.webmanifest    PWA / icon metadata
```

## Run it locally
```bash
cd "Claude Development"
python3 .claude/serve.py     # then open http://127.0.0.1:4321
```
(or any static server, e.g. `npx serve`).

## Add / edit a show
Open **`js/shows.js`** and copy a `{ … }` block. Set the title, `date` (`"2026-07-11T20:00"`),
venue, `status` (`onsale` / `few` / `soldout`), and the ticket `tiers`.

## Sell real tickets (Stripe — no server needed)
1. In Stripe → **Payment Links**, create one link per ticket tier.
2. Turn on **"Let customers adjust quantity"** on the link.
3. Paste the link into that tier's `checkoutUrl` in `js/shows.js`.

If `checkoutUrl` is left blank, the button falls back to your Linktree. The on-page
modal shows tier + quantity + live total, then hands off to Stripe's secure checkout.

## Connect the newsletter
The form validates and shows a success message but doesn't store emails yet. Wire it to
Mailchimp / Beehiiv / ConvertKit: set the `<form>` `action`/`method` in `index.html`, or
drop their embed snippet in. (See the `TODO` in `js/main.js`.)

## SEO & AI-citation features already built in
- Semantic HTML5, single `<h1>`, logical heading order, descriptive alt text, skip link.
- **JSON-LD structured data:** ComedyClub/LocalBusiness/Organization, Person (Evan Lopez),
  WebSite, FAQPage, and auto-generated **ComedyEvent** schema for every show.
- Open Graph + Twitter cards, canonical URL, theme-color.
- `robots.txt` explicitly allows AI crawlers; `sitemap.xml`; **`llms.txt`** summary for LLMs.
- Fast: lazy-loaded images, preconnected fonts, `fetchpriority` hero, minimal JS.

## Deploy
Drag the folder into Netlify/Vercel/Cloudflare Pages, or push to GitHub Pages. Then in
your DNS, point `topflightcomedy.com` at the host. **After launch:** submit
`https://topflightcomedy.com/sitemap.xml` in Google Search Console.

> Replace `assets/logo.png` (currently a 1024² PNG) and `assets/hero.jpg` with final art
> anytime — keep the same filenames and it just works. Use a real photo of Evan for the
> About section if you'd like (swap the `src` in the `#about` block).
