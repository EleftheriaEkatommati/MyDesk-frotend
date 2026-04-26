# MyDesk Admin Capabilities

## Admin-specific UI

Admins get a dedicated sidebar with links to:

- `User Management` (`/admin`)
- `Check-In` (`/check-in`)
- `Statistics` (`/statistics`)

Admins also retain standard features such as the dashboard and floor detail pages, with extra controls enabled.

## User management (`/admin`)

### What admins can do

- View all users.
- Promote regular users to admin.
- Demote admins back to regular users, with one important guard:
  - admins cannot demote their own account.
- Delete users, except the currently logged-in admin.

### Implementation details

- Protected in route loader using `authService.getState().user?.role?.name === 'admin'`.
- Fetches users via `getUsers(token)`.
- Role changes use `updateUserRole(userId, { role }, token)`.
- User deletion uses `deleteUser(userId, token)`.

## Check-in page (`/check-in`)

### What it does

- Uses the `html5-qrcode` scanner to read QR codes from the browser camera.
- Sends scanned QR payloads to `checkInBooking(qrData, token)`.
- Displays a success modal for the checked-in booking.

### Who can use it

- Admin-only route.
- Requires a valid admin JWT token and current admin profile.

## Statistics page (`/statistics`)

### What it shows

- Daily metrics:
  - expected bookings
  - checked in
  - pending bookings
  - cancelled bookings
  - check-in percentage
- Tables for:
  - checked-in bookings
  - pending bookings
  - users who have no booking

### Admin restrictions

- Admin-only route guard in the route loader.
- Fetches report data from `getDailyReport(token)`.
- Polls every 30 seconds to keep the report fresh.

## Admin desk and floor management

Admin workflows are also available on the main dashboard and floor screens.

### In `BookingCalendar`

Admins can:

- Create new floors using `createFloor()`.
- Delete floors using `deleteFloor()`.
- Click on empty floor space to add desks.
- View per-floor availability and navigate to floor detail pages.

### In `FloorRenderer`

Admin desk controls include:

- Add desks by clicking empty floor space.
- Drag desks to reposition them.
- Rotate desks.
- Delete desks.
- Delete bookings for desks.

Admins also see a bookings table at the bottom of the floor page for quick desk booking audit.
