# fly-form — טופס היתר יציאה לחו"ל בשמ"פ

A static Hebrew RTL web app for filling and downloading IDF reserve duty travel-permit forms (נספח א׳).

## Live Site

[https://israeleis.github.io/fly-form/](https://israeleis.github.io/fly-form/)

## Features

- **Soldier form** — fills sections 1-2 of the template (personal details, trip details)
- **Platoon selector** — auto-fills section 3 with the commander's details and signature
- **PDF download** — generates a filled PDF using the original scanned template
- **Commander setup page** (`/#/commander`) — commanders enter their details and draw a signature, exported as JSON via WhatsApp

## Setup

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Dev server

```bash
npm run dev
```

Open [http://localhost:5173/fly-form/](http://localhost:5173/fly-form/)

## Configuration

### Add a platoon

1. A commander visits `/#/commander`, fills their details, draws their signature, and sends it via WhatsApp
2. You receive the JSON and add it as an entry in `src/config/platoons.json`:

```json
[
  {
    "id": "platoon-1",
    "name": "פלוגה א",
    "commander": {
      "name": "ישראל ישראלי",
      "rank": "סגן",
      "personalNumber": "1234567",
      "signatureSvg": "<svg ...>...</svg>"
    }
  }
]
```

### Set your WhatsApp number

In `src/pages/CommanderSetup.tsx` line 4, replace the placeholder:

```ts
const ADMIN_WHATSAPP = '972501234567'  // your number in international format
```

### Calibrate PDF coordinates

The text coordinates in `src/lib/pdfCoords.ts` are approximate. After first run:

1. Fill the form with test values and download the PDF
2. Compare field positions against the original template
3. Adjust `x`/`y` values in `pdfCoords.ts` (origin is bottom-left, units are points)
4. Repeat until all fields align

## Deploy to GitHub Pages

```bash
npm run deploy
```

## Tech Stack

- React 18 + TypeScript + Vite
- React Router v6 (HashRouter)
- pdf-lib + @pdf-lib/fontkit — PDF injection with embedded Rubik Hebrew font
- Vitest — unit tests
- gh-pages — deployment
