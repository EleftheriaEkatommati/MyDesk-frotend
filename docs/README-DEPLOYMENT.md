# MyDesk Frontend Deployment & Run Guide

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the app in your browser:

- The default development URL is shown in the terminal, usually `http://localhost:5173`.

4. Build for production:

```bash
npm run build
```

5. Preview the production build locally:

```bash
npm run preview
```

## Available scripts

- `npm run dev`
  - Starts the Vite development server with hot module reloading.
- `npm run build`
  - Builds the app for production using TypeScript and Vite.
- `npm run preview`
  - Serves the production build locally for validation.
- `npm run lint`
  - Runs ESLint across the repository.

## Production deployment notes

- The application is a static SPA built with Vite.
- After `npm run build`, the production-ready assets are generated in the `dist/` folder.
- Deploy the contents of `dist/` to any static hosting platform, such as:
  - Vercel
  - Netlify
  - GitHub Pages
  - Firebase Hosting
  - Any static file server behind a reverse proxy

## Backend integration

- The frontend expects the backend API to be available at `http://localhost:8000/api/v1`.
- If the backend is hosted elsewhere, update the API base URL in `src/api.ts`:

```ts
const API_BASE = 'http://localhost:8000/api/v1'
```

- For production, replace that URL with your deployed backend host.

## Environment considerations

- There is currently no separate `.env` file or environment variable handling in the front-end source.
- The API base URL is hardcoded in `src/api.ts`, so change it there if your backend host differs.

## Recommended deployment flow

1. Run `npm install` on the CI or deployment host.
2. Run `npm run build`.
3. Publish the generated `dist/` directory.
4. Configure the production host to serve `index.html` for SPA routing.

## SPA routing

- The app uses client-side routing via `@tanstack/react-router`.
- If deployed behind a static server, ensure fallback routing is enabled so all paths resolve to `index.html`.

## Troubleshooting

- If the app cannot authenticate or load data, confirm `src/api.ts` is pointing to the correct backend host.
- Confirm the backend is up and accessible from the browser.
- If routing breaks in production, verify the server serves `index.html` for unknown paths.
