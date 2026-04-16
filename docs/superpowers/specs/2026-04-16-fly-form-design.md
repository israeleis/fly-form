# Fly Form — Design Spec
Date: 2026-04-16

## Overview

A static React/Vite app deployed to GitHub Pages. Soldiers fill a Hebrew travel-permit form (טופס היתר יציאה לחו"ל בשמ"פ), select their platoon, and download a filled PDF. A separate commander setup page lets platoon commanders submit their details + signature once, which the admin adds to the config.

---

## Architecture

```
fly-form/
├── public/
│   └── fly_form_template.pdf       # base scanned PDF template
├── src/
│   ├── config/
│   │   └── platoons.json           # platoon commander details (managed by admin)
│   ├── pages/
│   │   ├── SoldierForm.tsx         # soldier fills sections 1-2, selects platoon
│   │   └── CommanderSetup.tsx      # commander enters details + draws signature
│   ├── components/
│   │   ├── SignaturePad.tsx        # canvas-based hand signature → SVG output
│   │   └── PlatoonSelect.tsx      # dropdown populated from platoons.json
│   ├── lib/
│   │   └── pdfFiller.ts           # all pdf-lib overlay/injection logic
│   ├── App.tsx                    # HashRouter: / and /#/commander
│   └── main.tsx
├── fonts/
│   └── Rubik-Regular.ttf          # Hebrew font embedded by pdf-lib
└── vite.config.ts                 # base: '/fly-form/' for GitHub Pages
```

---

## Config: `platoons.json`

Managed manually by admin. Each entry represents one platoon.

```json
[
  {
    "id": "platoon-1",
    "name": "פלוגה א",
    "commander": {
      "name": "ישראל ישראלי",
      "rank": "סגן",
      "personalNumber": "1234567",
      "signatureSvg": "<svg xmlns='http://www.w3.org/2000/svg'>...</svg>"
    }
  }
]
```

---

## Page 1 — Soldier Form (`/`)

### Fields

**Section 1 — פרטי משרת המילואים:**
- מספר אישי (personal number)
- שם משפחה (family name)
- שם פרטי (first name)
- דרגה (rank)
- מטרת נסיעה (travel purpose)
- איש קשר בארץ: שם משפחה, שם פרטי, כתובת עדכנית, טלפון

**Section 2 — פרטי הבקשה:**
- מדינת יעד (destination country)
- תאריך יציאה מהארץ (departure date — date picker)
- תאריך חזרה לארץ (return date — date picker)
- כמות ימי שהייה (auto-calculated from departure/return dates, read-only)
- פירוט מסלול הטיסה (flight route + layovers — textarea)

**Platoon selector:**
- Dropdown populated from `platoons.json`
- Determines which commander config is injected into section 3

### On Submit

1. Validate all fields
2. Call `pdfFiller.ts` with form data + selected platoon config
3. Browser downloads the generated PDF

---

## Page 2 — Commander Setup (`/#/commander`)

### Fields
- שם מלא (full name)
- דרגה (rank)
- מספר אישי (personal number)
- שם פלוגה (platoon name — used as display name in soldier's dropdown)
- Signature pad (draw on canvas, exported as SVG string)

### On Submit

Packages all fields as JSON and opens WhatsApp:
```
https://wa.me/<ADMIN_NUMBER>?text=<url-encoded JSON>
```

No data is persisted. Admin receives the JSON via WhatsApp and manually adds it to `platoons.json` in the repo.

---

## PDF Injection (`pdfFiller.ts`)

1. Fetch `fly_form_template.pdf` from `public/`
2. Open with pdf-lib, embed `Rubik-Regular.ttf` for Hebrew text rendering
3. Overlay soldier's field values as text at pre-measured coordinates on page 1
4. For section 3: rasterize commander's SVG signature to PNG via `<canvas>`, embed PNG at section 3 signature coordinates; overlay commander name, rank, personal number, and today's date as text
5. Sections 4 and 5 are left blank
6. Output the modified PDF as a `Uint8Array` → `Blob` → `URL.createObjectURL` → trigger download

**Coordinate mapping:** Coordinates for each field are measured once during implementation and hardcoded as constants in `pdfFiller.ts`. Units are pdf-lib points (1pt = 1/72 inch).

---

## UI / Styling

- RTL layout: `<html dir="rtl" lang="he">`
- Hebrew font for UI: Rubik via Google Fonts (CSS)
- Same Rubik TTF embedded in pdf-lib for PDF text
- Minimal styling — functional, mobile-friendly

---

## Deployment

- `vite build` outputs to `dist/`
- `gh-pages` npm package deploys `dist/` to `gh-pages` branch
- Uses `HashRouter` (no server-side routing on GitHub Pages)
- `vite.config.ts`: `base: '/fly-form/'`

---

## Out of Scope

- Sections 4 and 5 (security + reserve officer approvals) — left blank for manual completion
- Any backend or data persistence
- Authentication
