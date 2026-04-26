# MyDesk Frontend API Endpoints

## Base URLs

- Public API base: `http://localhost:8000/api/v1`
- Admin API base: `http://localhost:8000/api/v1/admin`

## Authentication endpoints

- `POST /auth/login`
  - Used by `/login` to sign in with email/password.

- `POST /auth/register`
  - Used by `/register` to create a new user.

- `GET /auth/google/login`
  - Used by `/login` and `/register` to start Google SSO.

- `GET /auth/me/profile`
  - Used by `authService.loadUser()` to fetch the authenticated user.

## Desk and booking endpoints

- `GET /desks/floors`
  - Used by `getFloors()`.
  - Displays available floors on the dashboard.

- `GET /desks?date={date}`
  - Used by `getDesks()`.
  - Fetches desks for the selected date.

- `GET /desks/floors/{floorId}`
  - Used by `getFloor()`.
  - Gets metadata for a single floor.

- `GET /desks/floors/{floorId}/desks?booking_date={date}`
  - Used by `getDesksByFloor()`.
  - Loads the desk layout for a specific floor and date.

- `POST /desks/{deskId}/book`
  - Used by `bookDesk()`.
  - Books a desk for the current user on a selected date.

- `PUT /bookings/{bookingId}/cancel`
  - Used by `unbookDesk()`.
  - Cancels a booking.

- `GET /bookings/me`
  - Used by `getMyBookings()`.
  - Returns the current user’s bookings.

- `GET /bookings/attendance?date={date}&floor_id={floorId}`
  - Used by `getAttendance()`.
  - Loads attendance/check-in status data for the selected date and optional floor.

- `POST /bookings/check-in`
  - Used by `checkInBooking()`.
  - Submits QR code payloads for admin check-in.

- `GET /bookings/report/daily?report_date={date}`
  - Used by `getDailyReport()`.
  - Returns daily report metrics for admin statistics.

## Admin endpoints

- `GET /admin/users`
  - Used by `/admin` to list all users.

- `POST /admin/users`
  - Supported by `createUser()` but not currently exposed in the UI.

- `PUT /admin/users/{userId}/role`
  - Used by `/admin` to change a user’s role.

- `DELETE /admin/users/{userId}`
  - Used by `/admin` to delete a user.

- `DELETE /admin/bookings/{bookingId}`
  - Used by `deleteBooking()` in the floor renderer.

- `POST /admin/desks`
  - Used by `createDesk()`.

- `PUT /admin/desks/{deskId}`
  - Used by `updateDesk()` for desk rotation and repositioning.

- `DELETE /admin/desks/{deskId}`
  - Used by `deleteDesk()`.

- `POST /admin/floors`
  - Used by `createFloor()`.

- `DELETE /admin/floors/{floorId}`
  - Used by `deleteFloor()`.

## Notes on endpoint usage per page

- `/login` and `/register`: auth endpoints only.
- `/`: dashboard uses `getFloors()`, `getAttendance()`, and floor-level desk queries.
- `/floor/$floorId`: uses floor and desk loading endpoints plus optional admin user list.
- `/my-bookings`: uses `getMyBookings()` and `unbookDesk()`.
- `/profile`: uses only auth profile endpoint.
- `/admin`: uses `getUsers()`, `updateUserRole()`, and `deleteUser()`.
- `/check-in`: uses `checkInBooking()`.
- `/statistics`: uses `getDailyReport()`.

## Authorization requirements per endpoint

- Public:
  - `POST /auth/login`
  - `POST /auth/register`
  - `GET /auth/google/login`

- Authenticated:
  - `GET /auth/me/profile`
  - `GET /desks/floors`
  - `GET /desks?date=`
  - `GET /desks/floors/{floorId}`
  - `GET /desks/floors/{floorId}/desks?booking_date=`
  - `POST /desks/{deskId}/book`
  - `PUT /bookings/{bookingId}/cancel`
  - `GET /bookings/me`
  - `GET /bookings/attendance`
  - `POST /bookings/check-in`
  - `GET /bookings/report/daily`

- Admin-only:
  - All `/admin/*` endpoints
  - Many of the admin UI routes are protected with route loader checks.
