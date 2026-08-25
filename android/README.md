# SHOPTANTRA Android App (PWA + Trusted Web Activity wrapper)

This folder documents and configures the **minimal Android wrapper** for the
SHOPTANTRA production web app.

## Architecture

- **Web application (single source of truth):** `https://shoptantra.in`
  (the Next.js app in this repository).
- **Android app:** a Trusted Web Activity (TWA) / PWA wrapper that simply opens
  the production web app in a standalone full-screen Activity.
- **No business logic is duplicated inside the APK.** Authentication, cart,
  checkout, Razorpay payments, orders, and dashboards all continue to use the
  production backend at `https://shoptantra.in`.

## PWA (already implemented in this repo)

- `public/manifest.json` — name `SHOPTANTRA`, standalone display, theme
  color `#FF6B00`, 192x192 + 512x512 maskable icons, start_url `/`, scope `/`.
- `public/sw.js` — network-first service worker (live data always hits the
  production backend; static assets fall back to cache only when offline).
- Icons: `public/SHOPTANTRA.png`.

## Building the Android APK

Use **Bubblewrap** (Google's official TWA tool) or **PWABuilder** with the
`twa-manifest.json` below.

### Option A — PWABuilder (recommended, no Android Studio code)

1. Open `https://www.pwabuilder.com`.
2. Enter `https://shoptantra.in`.
3. Download the generated Android package.
4. Open the generated `android/` folder in Android Studio and run
   `Build > Generate Signed Bundle / APK`.

### Option B — Bubblewrap CLI

```bash
npm i -g @bubblewrap/cli
npx bubblewrap init --manifest https://shoptantra.in/manifest.json
npx bubblewrap build
# Signed APK/AAB will be produced under twaOutput/
```

The Android app will:

- Open `https://shoptantra.in` in a full-screen TWA activity.
- Keep the "SHOPTANTRA" name, standalone display, portrait orientation.
- Use the production backend for all flows (no duplicated logic).

## Notes

- A production-signed APK is published on the SHOPTANTRA "Download App" page
  (`https://shoptantra.in/download-app`). Rebuild that APK after each production
  deploy so it tracks the latest web version.
- `twa-manifest.json` below can be regenerated with
  `npx bubblewrap init --manifest https://shoptantra.in/manifest.json`.
