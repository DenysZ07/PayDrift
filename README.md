# PayDrift — marketing site

The website for **PayDrift**, a wage tracker for Apple devices: schedule shifts, log hours,
watch the current pay period add up in real time, and count down to payday.

Plain static HTML, CSS and JavaScript. No build step, no dependencies, no trackers.

```
index.html            landing page
privacy.html          privacy policy
support.html          support / troubleshooting
assets/css/style.css  all styles (light + dark themes)
assets/js/main.js     theme toggle, nav, reveal-on-scroll, the live app screen
assets/img/           logo, app icon, favicon, social card (+ its HTML source)
```

## Preview locally

Open `index.html` directly, or serve the folder so the relative paths behave exactly as they
will in production:

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

## Publish on GitHub Pages

```sh
git add .
git commit -m "Add PayDrift marketing site"
git push -u origin main
```

Then in the repository: **Settings → Pages → Build and deployment → Source: Deploy from a
branch**, branch `main`, folder `/ (root)`. The site goes live at
`https://denysz07.github.io/PayDrift/` within a minute or two.

Every path in the site is relative, so it works from that subdirectory as-is. If you later
point a custom domain at it, add a `CNAME` file and update the `<link rel="canonical">` and
`og:url` / `og:image` tags in the three HTML files.

## Before you go live

| Thing | Where | Why |
|---|---|---|
| **App Store URL** | `index.html`, two links marked `<!-- TODO -->` | Currently `https://apps.apple.com/app/paydrift`, which is a placeholder |
| **Support email** | all three pages, `support@paydrift.app` | Replace with the address you actually read |
| **Demo data** | `index.html`, the device mockups | Job names, amounts and the £ currency are illustrative. Swap in your own if you'd rather show real numbers |
| **App Store badge** | the two `.appstore` buttons | The button is a hand-built stand-in. Apple asks that you use its official badge — grab it from [Apple's marketing resources](https://developer.apple.com/app-store/marketing/guidelines/) and drop it in |
| **Privacy policy** | `privacy.html` | Written to match how you described the app (no accounts, no servers, iCloud private database, no analytics). **Read it and make sure every sentence is true of the shipping build** — if you ever add crash reporting or analytics, this page has to say so |
| **Last-updated date** | `privacy.html`, the `<time>` element | Bump it whenever the policy changes |

A `<script type="application/ld+json">` block in `index.html` describes the app for search
engines — worth updating if the price or platforms change.

## Notes on the build

**Themes.** Light and dark are both designed, not flipped. Colours live as custom properties
at the top of `style.css` under three scopes: `:root` (light), a `prefers-color-scheme: dark`
media query, and `:root[data-theme="dark"]` so the in-page toggle wins in both directions.
The toggle stores its choice in `localStorage` and clears it when you land back on the system
setting.

**The device mockups are rebuilt from the shipping app**, not invented: the Overview screen's
layout, its per-job cards, the teal accent (`#0e7490`) and the job dot colours are all taken
from a real screenshot. The demo data is in pounds and internally consistent — £90.63 is exactly
7h 15m at £12.50/hr, and the £174.07 of scheduled work on the second card is 12h 15m at its own
rate. The first card's figure and hours tick upward from a single clock in `main.js`, so the
screen is never frozen; `RATE` and `baseHours` at the top of that block are the only two numbers
to change.

**Accessibility.** Both device mockups are `role="img"` with a label describing what they
show, so screen readers get the meaning rather than a pile of fake UI text. Motion respects
`prefers-reduced-motion`, and the reveal-on-scroll effect is only armed when JavaScript runs,
so the page is fully readable without it.

**Chart colours are validated, not eyeballed.** The bars in the analytics panel use a single
hue: `#0e7490` for the current week and `#38b6d6` for prior weeks, checked as an ordinal ramp
against the white panel surface — monotone lightness, a visible step between them, and a light
end that still clears the surface.

## Regenerating the social card

`assets/img/og.png` is rendered from `assets/img/og.source.html`. Edit the source, then:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars --force-color-profile=srgb \
  --force-device-scale-factor=2 --window-size=1200,630 \
  --screenshot=/tmp/og@2x.png \
  "file://$PWD/assets/img/og.source.html"

python3 -c "from PIL import Image; \
Image.open('/tmp/og@2x.png').convert('RGB').resize((1200,630), Image.LANCZOS) \
.save('assets/img/og.png','PNG',optimize=True)"
```

Rendering at 2× and downscaling keeps the text crisp. Chrome may not exit on its own after
writing the screenshot — quit it once the file appears.
