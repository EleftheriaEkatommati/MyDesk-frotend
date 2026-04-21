export type Booking = {
  id: number
  desk_id: number
  user_id: number
  booking_date: string
  status: string
  // Backend now includes the full desk and user objects for convenience
  desk?: Desk
  user?: User
}

export type Desk = {
  id: number
  floorId: number
  x: number
  y: number
  rotation: number
  isBooked: boolean
  bookedBy: number | null
  floor?: Floor
  bookingId?: number
}

export type Floor = {
  id: number
  floor_name: string
  floor_number: number
}

export type User = {
  id: number // NOTE: Changed from string as admin/user endpoints return numeric IDs.
  name: string
  email: string
  surname?: string | null
  role?: Role
}

export type UserProfileUpdate = {
  name?: string
  surname?: string
}

export type DeskCreatePayload = {
  x: number
  y: number
  rotation: number
  floorId: number
}

// New type to match the /login response from the backend
export type AuthResponse = {
  id: string
  name: string
  role: string
  token: string
}

// The AuthUser was problematic as it mixed two different data shapes.
// The login function will now return the direct AuthResponse.
// The application logic can then use the token from AuthResponse to fetch the full user profile if needed.
export type AuthUser = User & {
  token: string
}

export type Role = {
  id: number
  name: string
}

export type UserCreate = {
  email: string
  password: string
  name?: string
  surname?: string
}

export type RoleUpdate = {
  role: string
}

const API_BASE = 'http://localhost:8000/api/v1' // Or your API's base URL
const ADMIN_API_BASE = `${API_BASE}/admin`

// A custom error for 404s to be handled in the loader
export class NotFoundError extends Error {}

// Existing functions (now hitting an API)
export async function getFloors(): Promise<Floor[]> {
  // Path updated based on user's documentation
  const res = await fetch(`${API_BASE}/desks/floors`)
  if (!res.ok) throw new Error('Failed to fetch floors')
  const data = await res.json()
  // Map camelCase from API to snake_case in the frontend type
  return data.map((f: any) => ({
    id: f.id,
    floor_name: f.floorName,
    floor_number: f.floorNumber,
  }))
}

export async function getDesks(date: string): Promise<Desk[]> {
  const res = await fetch(`${API_BASE}/desks?date=${date}`)
  if (!res.ok) throw new Error('Failed to fetch desks')
  const data = await res.json()
  // Cleaned up mapping. The backend consistently returns snake_case for these fields.
  return data.map(
    (d: any): Desk => ({
      id: d.id,
      x: d.x,
      y: d.y,
      rotation: d.rotation,
      floorId: d.floorId,
      floor: d.floor,
      isBooked: d.isBooked,
      bookedBy: d.bookedBy,
      bookingId: d.bookingId,
    }),
  )
}

// New more specific functions
export async function getFloor(floorId: number): Promise<Floor> {
  const res = await fetch(`${API_BASE}/desks/floors/${floorId}`)
  if (!res.ok) {
    if (res.status === 404)
      throw new NotFoundError(`Floor with id ${floorId} not found`)
    throw new Error('Failed to fetch floor')
  }
  const f = await res.json()
  // Map camelCase from API to snake_case in the frontend type
  return {
    id: f.id,
    floor_name: f.floorName,
    floor_number: f.floorNumber,
  }
}

/**
 * Updates the current user's profile.
 * @param profileData The data to update.
 * @param token The user's authentication token.
 * @returns A promise that resolves to the updated User object.
 */
// FIXME: This endpoint does not exist on the backend.
// The backend has a GET /api/v1/auth/me/profile, but no PUT for updates.
// This function will fail with a 405 Method Not Allowed error.
export async function updateUserProfile(
  profileData: UserProfileUpdate,
  token: string,
): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  })
  if (!res.ok) {
    throw new Error('Failed to update profile')
  }
  return res.json()
}

export async function login(
  username: string,
  password?: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail || 'Login failed')
  }
  return res.json()
}

export async function getCurrentUser(token: string): Promise<User | null> {
  // Path updated based on user's documentation
  const res = await fetch(`${API_BASE}/auth/me/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (res.status === 401) {
    // The user is not logged in
    return null
  }
  if (!res.ok) {
    throw new Error('Failed to fetch user')
  }
  return res.json()
}

export async function getDesksByFloor(
  floorId: number,
  date: string,
): Promise<Desk[]> {
  const res = await fetch(
    `${API_BASE}/desks/floors/${floorId}/desks?booking_date=${date}`,
  )
  if (!res.ok) {
    throw new Error(
      `Failed to fetch desks for floor ${floorId} on date ${date}`,
    )
  }

  const data = await res.json()
  // Cleaned up mapping. The backend consistently returns snake_case for these fields.
  return data.map(
    (d: any): Desk => ({
      id: d.id,
      x: d.x,
      y: d.y,
      rotation: d.rotation,
      floorId: d.floorId,
      floor: d.floor,
      isBooked: d.isBooked,
      bookedBy: d.bookedBy,
      bookingId: d.bookingId,
    }),
  )
}
export async function bookDesk(
  deskId: number,
  token: string,
  date: string,
): Promise<Booking> {
  const res = await fetch(`${API_BASE}/desks/${deskId}/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      booking_date: date,
    }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail || `Failed to book desk ${deskId}`)
  }
  return res.json()
}

export async function unbookDesk(
  bookingId: number,
  token: string,
): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to cancel booking ${bookingId}`)

  // The backend returns a Booking object, which matches the type. No mapping needed.
  return res.json()
}

/**
 * Fetches all bookings for the currently authenticated user.
 * @param token The user's authentication token.
 * @returns A promise that resolves to an array of Booking objects.
 */
export async function getMyBookings(
  token: string,
  date?: string,
): Promise<Booking[]> {
  const url = new URL(`${API_BASE}/bookings/me`)
  if (date) url.searchParams.append('date', date)

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    throw new Error('Failed to fetch user bookings')
  }
  return res.json()
}

// Admin functions

/**
 * Fetches a list of all users. Requires admin privileges.
 * @param token The admin user's authentication token.
 * @returns A promise that resolves to an array of User objects.
 */
export async function getUsers(token: string): Promise<User[]> {
  const res = await fetch(`${ADMIN_API_BASE}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    throw new Error('Failed to fetch users')
  }
  return res.json()
}

/**
 * Creates a new user. Requires admin privileges.
 * @param userData The data for the new user.
 * @param token The admin user's authentication token.
 * @returns A promise that resolves to the created User object.
 */
export async function createUser(
  userData: UserCreate,
  token: string,
): Promise<User> {
  const res = await fetch(`${ADMIN_API_BASE}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  })
  if (!res.ok) {
    throw new Error('Failed to create user')
  }
  return res.json()
}

/**
 * Updates the role of a specific user. Requires admin privileges.
 * @param userId The ID of the user to update.
 * @param roleData The new role for the user.
 * @param token The admin user's authentication token.
 * @returns A promise that resolves to the updated User object.
 */
export async function updateUserRole(
  userId: number,
  roleData: RoleUpdate,
  token: string,
): Promise<User> {
  const res = await fetch(`${ADMIN_API_BASE}/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(roleData),
  })
  if (!res.ok) {
    throw new Error(`Failed to update role for user ${userId}`)
  }
  return res.json()
}

/**
 * Registers a new user publicly.
 * @param userData The data for the new user (name, email, password).
 * @returns A promise that resolves to an AuthResponse, typically containing a JWT token.
 */
export async function registerUser(
  userData: UserCreate,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
  if (!res.ok) {
    // The backend should return a specific error message.
    // For example, a 409 Conflict with a JSON body like { "detail": "Email already registered" }
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail || 'Registration failed')
  }
  return res.json()
}

export async function deleteUser(userId: number, token: string) {
  const res = await fetch(`${ADMIN_API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to delete user ${userId}`)
  }
}

export async function deleteBooking(bookingId: number, token: string) {
  const res = await fetch(`${ADMIN_API_BASE}/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    throw new Error('Failed to delete booking')
  }
}

export async function createDesk(
  data: DeskCreatePayload,
  token: string,
): Promise<Desk> {
  const res = await fetch(`${ADMIN_API_BASE}/desks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data), // The payload must not include an id.
  })
  if (!res.ok) {
    throw new Error('Failed to create desk')
  }
  return res.json() as Promise<Desk>
}

export async function deleteDesk(deskId: number, token: string) {
  const res = await fetch(`${ADMIN_API_BASE}/desks/${deskId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    throw new Error('Failed to delete desk')
  }
}

export async function updateDesk(
  deskId: number,
  data: Partial<{ x: number; y: number; rotation: number }>,
  token: string,
) {
  const res = await fetch(`${ADMIN_API_BASE}/desks/${deskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) throw new Error('Failed to update desk')
  return res.json()
}
