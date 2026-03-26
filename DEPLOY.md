# Deploying RRF Coral Nursery as a PWA on Cloudflare Pages

## What you're getting
- Hosted on Cloudflare Pages (free tier, auto-deploys from GitHub)
- Works as a PWA — installable on iOS/Android home screens
- Offline capable (service worker caches the app shell)
- Your existing Cloudflare R2 storage is unchanged

---

## Step 1 — Create the GitHub repo

1. Go to https://github.com/new
2. Name it `rrf-coral-nursery` (private is fine)
3. Don't add a README (you'll push existing files)

## Step 2 — Push your code

In your project folder run:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rrf-coral-nursery.git
git push -u origin main
```

## Step 3 — Connect to Cloudflare Pages

1. Log into https://dash.cloudflare.com
2. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Authorise GitHub and select your repo
4. Set build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**

Your app will be live at `https://rrf-coral-nursery.pages.dev` in about 60 seconds.

## Step 4 — Generate your PWA icons

You need a square PNG logo (at least 512×512px, ideally 1024×1024px).

```bash
npm install sharp --save-dev
node generate-icons.mjs ./your-logo.png
git add public/
git commit -m "Add PWA icons"
git push
```

This creates:
- `public/icons/icon-192.png` — Android/Chrome icon
- `public/icons/icon-512.png` — Large icon / splash
- `public/apple-touch-icon.png` — iOS home screen icon (180×180)
- `public/icons/splash-*.png` — iOS splash screens

## Step 5 — Install vite-plugin-pwa

```bash
npm install vite-plugin-pwa workbox-window --save-dev
```

Replace your `vite.config.ts` with the one provided (already done if you used the output files).

## Step 6 — Install on iOS

1. Open the deployed URL in Safari on iPhone/iPad
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

The app will now appear on the home screen with your icon, launch full-screen with no browser chrome, and work offline.

---

## Setting up Claude Code (so Claude can work on the repo directly)

1. Install Claude Code: https://docs.anthropic.com/en/docs/claude-code
2. Clone your repo: `git clone https://github.com/YOUR_USERNAME/rrf-coral-nursery.git`
3. In terminal, `cd rrf-coral-nursery` then run `claude`
4. Claude can now read, edit, and commit files directly

Every push to `main` auto-deploys to Cloudflare Pages.

---

## Files changed from original

| File | Change |
|------|--------|
| `vite.config.ts` | Added `vite-plugin-pwa` with Workbox config |
| `package.json` | Added `vite-plugin-pwa` + `workbox-window` dev deps; removed redundant Node shims (`stream`, `crypto`, `buffer`) |
| `index.html` | Added iOS PWA meta tags (`apple-mobile-web-app-capable`, touch icons, etc.); removed broken `index.css` link |
| `public/_redirects` | New — tells Cloudflare Pages to serve `index.html` for all routes (SPA routing) |
| `generate-icons.mjs` | New — run once to generate all icon sizes from your logo |

---

## iOS PWA known limitations

- **No push notifications** without a paid service (iOS 16.4+ supports Web Push but requires a registered domain)
- **Storage**: iOS limits PWA storage to ~50MB by default (your R2 cloud data is unaffected — that's not local storage)
- **Camera/mic**: Works fine in PWA mode on iOS 14.3+
- **Updates**: The service worker auto-updates silently on next launch after a new deploy
