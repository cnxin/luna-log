# Luna Log

Luna Log is a local-first Expo demo for private intimacy and cycle tracking.

## Features

- Phone-shaped mobile preview for web, Android, and iOS development.
- Separate partnered sex and solo sex entry flows.
- Cycle calendar with period, fertile window, ovulation, and intimacy markers.
- Weekly, monthly, and yearly intimacy statistics.
- Three visual themes inspired by LifeLog: classic, mint, and blue.
- About screen with update checking, release notes, source diagnostics, and GitHub download links.

## Development

```bash
npm install
npm run web:preview
```

The web preview runs on port `8090` by default.

## Update Manifest

The app checks `update-manifest.json` from GitHub raw and jsDelivr. Publish a new version by updating:

- `package.json`
- `app.json`
- `APP_VERSION` in `App.tsx`
- `update-manifest.json`

