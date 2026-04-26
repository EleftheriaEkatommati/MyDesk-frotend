# MyDesk Frontend Authorization

## Authentication flow

### Auth service

The app uses `src/auth.tsx` to centralize authentication:

- `AuthService` is a singleton that stores:
  - `token` in `localStorage`
  - `user` profile in memory
- It exposes:
  - `login(username, password)`
  - `logout()`
  - `loadUser()` / `ensureLoaded()`
  - `getState()`
  - `subscribe()` for React components

### Token storage

- The JWT token is saved to `localStorage` under key `token`.
- After login or Google callback, the token is stored and `getCurrentUser()` is called to fetch the full profile.
- If token validation fails, the app clears the token and treats the user as unauthenticated.

## Login options

### Email/password login
- `src/api.ts` calls `POST http://localhost:8000/api/v1/auth/login`.
- The app expects an `AuthResponse` containing `token`, `id`, `name`, and `role`.

### Google SSO login
- The login page redirects to `http://localhost:8000/api/v1/auth/google/login`.
- The callback route `/auth/callback` accepts `token` from the URL and stores it in `localStorage`.
- After the callback, `reloadUser()` is called and the user is redirected to the original target.

## Current user profile

- The profile is loaded from `GET http://localhost:8000/api/v1/auth/me/profile`.
- `getCurrentUser(token)` returns the authenticated user or `null` for invalid/expired tokens.

## Route protection

### General authenticated routes

The app guards many routes with `context.auth.ensureLoaded()` and checks `authService.getState().user`:

- `/` home dashboard
- `/profile`
- `/settings`
- `/about`
- `/register` and `/login` are public, but they redirect authenticated users when needed.

### Admin-only routes

The following routes require the authenticated user to have `role.name === 'admin'`:

- `/admin`
- `/check-in`
- `/statistics`

If the check fails, the user is redirected to `/login`.

### User-only route behavior

- `/my-bookings` is intended for regular users.
- If an authenticated admin reaches `/my-bookings`, they are redirected back to `/`.

## Auth context in components

- `AuthProvider` wraps the app and provides `user` and `token`.
- `useAuth()` returns:
  - `user`
  - `token`
  - `isAuthenticated`
  - `login()`
  - `logout()`
  - `reloadUser()`
  - `ensureLoaded()`

This makes it easy for pages and components to handle protected data and retry logic.
