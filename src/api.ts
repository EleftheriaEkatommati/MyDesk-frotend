export type Booking = {
  id: number
  desk_id: string
  user_id: number
  booking_date: string
  status: string
}

export type Desk = {
  id: string
  floor_id: number
  x: number
  y: number
  rotation: number
  isBooked: boolean
  bookedBy: number | string | null
  floor_entity?: Floor
  bookingId?: number
}

export type Floor = {
  id: number
  floor_name: string
  floor_number: number
}

export type User = {
  id: string
  name: string
  email: string
  surname?: string | null
}

export type AuthUser = User & {
  token: string
}

const API_BASE = 'http://localhost:8000/api/v1' // Or your API's base URL

// A custom error for 404s to be handled in the loader
export class NotFoundError extends Error {}

// Existing functions (now hitting an API)
export async function getFloors(): Promise<Floor[]> {
  // Path updated based on user's documentation
  const res = await fetch(`${API_BASE}/desks/floors`)
  if (!res.ok) throw new Error('Failed to fetch floors')
  return res.json()
}

export async function getDesks(date: string): Promise<Desk[]> {
  const res = await fetch(`${API_BASE}/desks?date=${date}`)
  if (!res.ok) throw new Error('Failed to fetch desks')
  const data = await res.json()
  return data.map((d: any) => ({
    ...d,
    floor_id: d.floor_id ?? d.floorId ?? null,
    isBooked: d.isBooked ?? d.is_booked ?? false,
    bookedBy: d.bookedBy ?? d.booked_by ?? d.user_id ?? null,
    bookingId: d.bookingId ?? d.booking_id ?? null,
  }))
}

// New more specific functions
export async function getFloor(floorId: number): Promise<Floor> {
  const res = await fetch(`${API_BASE}/desks/floors/${floorId}`)
  if (!res.ok) {
    if (res.status === 404)
      throw new NotFoundError(`Floor with id ${floorId} not found`)
    throw new Error('Failed to fetch floor')
  }
  return res.json()
}

export async function login(
  username: string,
  password?: string,
): Promise<AuthUser> {
  // NOTE: In a real app, you'd send the credentials to a server endpoint.
  // Path updated to a conventional guess based on /api/auth/me
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password }),
  })
  if (!res.ok) {
    throw new Error('Login failed')
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
  // Map snake_case to camelCase to ensure the frontend reads the booked states correctly
  return data.map((d: any) => ({
    ...d,
    isBooked: d.isBooked ?? d.is_booked ?? false,
    bookedBy: d.bookedBy ?? d.booked_by ?? d.user_id ?? null,
    bookingId: d.bookingId ?? d.booking_id ?? null,
  }))
}
export async function bookDesk(
  deskId: string,
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
    throw new Error(`Failed to book desk ${deskId}`)
  }
  return res.json()
}

export async function unbookDesk(
  bookingId: number,
  token: string,
): Promise<Desk> {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to cancel booking ${bookingId}`)

  const d = await res.json()
  return {
    ...d,
    isBooked: d.isBooked ?? d.is_booked ?? false,
    bookedBy: d.bookedBy ?? d.booked_by ?? d.user_id ?? null,
    bookingId: d.bookingId ?? d.booking_id ?? null,
  }
}
