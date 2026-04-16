# Admin Panel — Agent Instructions

## Tech Stack

- **Build**: Vite
- **Framework**: React (JSX, not TypeScript)
- **Styling**: Vanilla CSS (`src/index.css`)
- **Routing**: React Router (in `src/App.jsx`)

## File Organization

```
admin/
  src/
    App.jsx        → Main app with routing
    main.jsx       → Entry point
    index.css      → Global styles
    components/    → Reusable UI components
    screens/       → Page-level components
    utils/         → Helper functions
    assets/        → Static assets (images, icons)
  public/          → Static files served as-is
  index.html       → HTML template
```

## Conventions

1. **JSX (not TSX)** — the admin panel uses plain JavaScript, not TypeScript.
2. **Vanilla CSS** — no TailwindCSS or CSS modules. All styles in `src/index.css` or component-level `.css` files.
3. **API calls** use the same backend at `http://localhost:5000/api` (or production URL).
4. **Admin auth** — admin users log in with email/password (not OTP). Token stored in `localStorage`.

## Running

```bash
cd admin && npm run dev       # Vite dev server on port 5173
cd admin && npm run build     # Production build to dist/
```

## Deployment

- Deployed at `admin.rahultambare.click`
- Uses Docker: `admin/Dockerfile`
