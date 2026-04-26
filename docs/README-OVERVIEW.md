# MyDesk Frontend Overview

## What this application is

MyDesk is a React + TypeScript + Vite frontend for a desk booking and office attendance system. It uses:

- `@tanstack/react-router` for route-based navigation and guarded routes
- `@tanstack/react-query` for data fetching and caching
- `react-hot-toast` for user notifications
- `html5-qrcode` for QR check-in scanning
- Tailwind CSS utility classes for styling

## Core structure

- `src/api.ts` — API client layer with all backend endpoint calls.
- `src/auth.tsx` — authentication state, token persistence, login/logout, and context provider.
- `src/routes/` — application pages and route protections.
- `src/components/` — reusable UI pieces, including the booking calendar, floor renderer, sidebar, and booking confirmations.
- `src/routes/__root.tsx` — app shell with `Sidebar`, route outlet, and auth-aware layout.

## Primary pages

### `/login`
- Present the login form for email/password authentication.
- Supports Google SSO redirect via `http://localhost:8000/api/v1/auth/google/login`.
- Uses `auth.login()` from `src/auth.tsx`.
- On success, stores a token in `localStorage`, reloads profile data, and redirects to the saved `redirect` destination or `/`.

### `/register`
- Register screen for new users.
- Calls `registerUser({ name, email, password })`.
- Immediately logs in the user after successful registration.

### `/logout`
- Simple logout confirmation page.
- The actual logout action is performed by the sidebar button, which clears auth state and token.

### `/` (Home Dashboard)
- Protected route: requires authenticated user.
- Displays a welcome message and renders `BookingCalendar`.
- `BookingCalendar` is the main dashboard for selecting dates, viewing floor availability, and accessing floor details.

### `/floor/$floorId`
- Floor detail screen with desk map and booking interactions.
- Loads floor metadata and desk layout for a selected date.
- Renders `FloorRenderer` and shows a booking confirmation card when the current user has a booking.
- Admins receive additional desk management controls on this page.

### `/profile`
- Shows current user details and role information.
- Includes profile edit controls, but the save action is intentionally disabled because the backend endpoint is not implemented.

### `/my-bookings`
- User-only route for non-admins.
- Shows a grouped listing of Active, Past, and Cancelled bookings.
- Allows the user to cancel a booking via `unbookDesk()`.

### `/admin`
- Admin-only user management interface.
- Lists platform users and allows role promotion/demotion and user deletion.

### `/check-in`
- Admin-only QR code check-in page.
- Uses `html5-qrcode` to scan a code and post to `checkInBooking()`.

### `/statistics`
- Admin-only statistics dashboard.
- Displays daily report cards and tables for checked-in bookings, pending bookings, and users without a booking.

### `/settings`
- Placeholder protected page.
- Requires authentication but currently only renders a heading.

### `/about`
- Simple placeholder page that requires authentication.

### `/the-plan`
- Currently an empty route file.
- May serve future planning or roadmap functionality.
