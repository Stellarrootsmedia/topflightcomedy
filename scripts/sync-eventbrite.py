#!/usr/bin/env python3
"""
sync-eventbrite.py  —  refresh Top Flight Comedy shows from Eventbrite.

Re-scrapes the Eventbrite organizer page, pulls every event's upcoming
dates, venue and flyer image, downloads thumbnails into assets/shows/,
and regenerates js/shows.js.

Usage:
    python3 scripts/sync-eventbrite.py

No third-party dependencies (uses the Python standard library).
Run it whenever your Eventbrite lineup changes, then commit + push:
    git add -A && git commit -m "Sync shows from Eventbrite" && git push

To run it automatically on a schedule, see README ("Keeping shows in sync").
"""
import html, json, os, re, sys, urllib.parse, urllib.request
from datetime import datetime

ORGANIZER = "https://www.eventbrite.com/o/78517158513"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets", "shows")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# A short, friendly blurb + type per event slug keyword (edit to taste).
META = {
    "daywalkers": ("showcase", "Tired of late shows? Daywalkers features comics from Netflix, The Comedy Mothership, Cap City, Kill Tony, Skankfest & more."),
    "hump-day":   ("weekly",   "Get over the hump with Austin's funniest. A midweek stand-up showcase packed with sharp local comics and surprise drop-ins."),
    "early-show": ("showcase", "An earlier curtain for a packed night of stand-up — beat the late crowd and catch a fresh lineup of Austin headliners."),
}

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://www.eventbrite.com/"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")

def slug_id(url):
    if "daywalkers" in url: return "daywalkers"
    if "hump-day" in url:   return "humpday"
    if "early-show" in url: return "earlyshow"
    m = re.search(r"/e/([a-z0-9-]+)-tickets-\d+", url)
    return (m.group(1) if m else "show")[:24]

def meta_for(url):
    for key, val in META.items():
        if key in url:
            return val
    return ("showcase", "A night of live stand-up comedy from Top Flight Comedy in Austin, Texas.")

def parse_event(url):
    page = get(url)
    m = re.search(r'<meta property="og:title" content="([^"]+)"', page)
    title = html.unescape(m.group(1).strip()) if m else "Top Flight Comedy Show"
    title = title.replace("Top Flight Comedy Presents: ", "").replace(" Tickets", "")
    title = title.split(" | ")[-1].strip()  # "East Austin Comedy | Hump Day Haha's" -> "Hump Day Haha's"
    # upcoming datetimes from Next.js data
    today = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    dts = sorted(set(re.findall(r"(20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d)", page)))
    future = [d[:16] for d in dts if d >= today]
    # drop end-times: each occurrence lists start + end (end is a few hours later).
    # greedily keep a time only if it's >7h after the previously kept time.
    kept = []
    for d in future:
        if kept and abs_min(d) - abs_min(kept[-1]) <= 420:
            continue
        kept.append(d)
    # Eventbrite only reliably exposes the NEXT occurrence for recurring series,
    # so we keep just that one (accurate). The full schedule lives on Eventbrite.
    future = kept[:1]
    venue = re.search(r'"venue"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"', page)
    venue = venue.group(1) if venue else "East Austin Comedy"
    # signed flyer image
    og = re.search(r'<meta property="og:image" content="([^"]+)"', page).group(1).replace("&amp;", "&")
    inner = re.search(r"url=([^&]+)", og)
    img_url = urllib.parse.unquote(inner.group(1)) if inner else ""
    return {"title": title, "dates": future[:8], "venue": venue, "img": img_url, "url": url}

def abs_min(iso):
    d = datetime.strptime(iso, "%Y-%m-%dT%H:%M")
    return int(d.timestamp() // 60)

def download(img_url, dest):
    if not img_url:
        return
    try:
        req = urllib.request.Request(img_url, headers={"User-Agent": UA, "Referer": "https://www.eventbrite.com/"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        if data[:2] == b"\xff\xd8":  # JPEG magic
            with open(dest, "wb") as f:
                f.write(data)
            print("  thumb:", os.path.basename(dest), len(data), "bytes")
    except Exception as e:
        print("  thumb FAILED:", e)

def main():
    os.makedirs(ASSETS, exist_ok=True)
    org = get(ORGANIZER)
    urls = sorted(set(re.findall(r"https://www\.eventbrite\.com/e/[a-z0-9-]+-tickets-\d+", org)))
    if not urls:
        print("No events found on organizer page — aborting (shows.js unchanged).")
        sys.exit(1)
    print("Found", len(urls), "events.")
    shows = []
    for u in urls:
        ev = parse_event(u)
        sid = slug_id(u)
        typ, blurb = meta_for(u)
        img_rel = "assets/shows/%s.jpg" % sid
        download(ev["img"], os.path.join(ASSETS, "%s.jpg" % sid))
        print("  -", ev["title"], "|", ev["dates"])
        shows.append({
            "id": sid, "title": ev["title"], "type": typ,
            "venue": ev["venue"], "address": "2505 East 6th Street, Suite D, Austin, TX 78702",
            "city": "Austin, TX", "image": img_rel,
            "ticketUrl": u + ("?aff=oddtdtcreator" if "daywalkers" in u else ""),
            "blurb": blurb, "status": "onsale", "dates": ev["dates"],
        })
    # keep a static corporate entry at the end
    shows.append({
        "id": "corporate", "title": "Corporate & Private Events", "type": "corporate",
        "venue": "Your venue or ours", "address": "Austin & nationwide", "city": "Austin, TX",
        "image": "assets/hero.jpg", "ticketUrl": "https://topflightcomedy.com/contact/",
        "blurb": "Fully produced comedy for company parties, conferences, off-sites and private speakeasy nights. Clean or edgy, scalable to 500+ guests.",
        "status": "onsale", "dates": [],
    })
    write_shows_js(shows)
    print("Wrote js/shows.js with", len(shows), "shows. Review, then commit & push.")

def write_shows_js(shows):
    header = ('/* AUTO-GENERATED by scripts/sync-eventbrite.py — last synced %s */\n'
              'window.TFC_VENUE = { name: "East Austin Comedy", address: "2505 East 6th Street, Suite D", city: "Austin, TX 78702" };\n'
              'window.TFC_LINKS = { eventbrite: "%s", beacons: "https://beacons.ai/evanlopez", linktree: "https://linktr.ee/topflightcomedy" };\n'
              'window.TFC_SHOWS = %s;\n') % (
                  datetime.now().strftime("%Y-%m-%d"), ORGANIZER, json.dumps(shows, indent=2))
    with open(os.path.join(ROOT, "js", "shows.js"), "w") as f:
        f.write(header)

if __name__ == "__main__":
    main()
