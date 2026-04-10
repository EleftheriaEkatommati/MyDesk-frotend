export type Desk = {
  id: string
  floorId: number
  x: number
  y: number
  rotation: number
  isBooked: boolean
  bookedBy?: number
  floorName?: string
  floor?: string
}

export type Floor = {
  id: number
  floorName: string
  floorNumber: number
}

export type User = {
  id: string
  name: string
  email: string
}

export type AuthUser = User & {
  token: string
}

const API_BASE = 'http://localhost:8000/api' // Or your API's base URL

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
  return res.json()
}

// New more specific functions
export async function getFloor(floorId: number): Promise<Floor> {
  // No endpoint for single floor, so fetching all and filtering
  const floors = await getFloors()
  const floor = floors.find((f) => f.id === floorId)
  if (!floor) {
    throw new NotFoundError(`Floor with id ${floorId} not found`)
  }
  return floor
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
  const res = await fetch(`${API_BASE}/auth/me`, {
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


 export async function getDesksByFloor(floorId: number, date: string): Promise<Desk[]> {
  const res = await fetch(`${API_BASE}/desks/floor/${floorId}?date=${date}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch desks for floor ${floorId} on date ${date}`)
  }
  return res.json()
}
export async function bookDesk(
  deskId: string,
  userId: string,
  token: string,
  date: string,
): Promise<Desk> {
  const res = await fetch(`${API_BASE}/desks/${deskId}/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    // Backend expects user_id as an integer
    body: JSON.stringify({
      user_id: parseInt(userId, 10),
      booking_date: date,
    }),
  })
  if (!res.ok) {
    throw new Error(`Failed to book desk ${deskId}`)
  }
  return res.json()
}

export async function unbookDesk(deskId: string, token: string): Promise<Desk> {
  // Assuming conventional path
  const res = await fetch(`${API_BASE}/desks/${deskId}/unbook`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to unbook desk ${deskId}`)
  return res.json()
}
