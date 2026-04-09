// src/api.ts

export interface Desk {
  id: string
  x: number
  y: number
  isBooked: boolean
  rotation: number
  floor: string
  floorId: number
  floorName: string | null
  bookedBy?: string | null
}

export interface Floor {
  id: number
  floorNumber: number
  floorName: string
}

export interface User {
  id: string
  name: string
  token: string
}

const BASE_URL = 'http://localhost:8000/api'

const getHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export const login = async (
  username: string,
  password?: string,
): Promise<User> => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json() // { id, name, token }
}

export const getCurrentUser = async (token: string): Promise<User> => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to get user')
  return res.json() // { id, name, token }
}

export const getDesks = async (): Promise<Desk[]> => {
  const res = await fetch(`${BASE_URL}/desks`)
  if (!res.ok) throw new Error('Failed to fetch desks')
  return res.json() // Array of Desk objects
}

export const getFloors = async (): Promise<Floor[]> => {
  const res = await fetch(`${BASE_URL}/desks/floors`)
  if (!res.ok) throw new Error('Failed to fetch floors')
  return res.json() // Array of Floor objects
}

export const getDesksByFloor = async (floor: string): Promise<Desk[]> => {
  const res = await fetch(
    `${BASE_URL}/desks/floor/${encodeURIComponent(floor)}`,
  )
  if (!res.ok) throw new Error('Failed to fetch desks for floor')
  return res.json() // Array of Desk objects for the floor
}

export const bookDesk = async (
  deskId: string,
  book: boolean,
  token: string,
): Promise<Desk> => {
  const res = await fetch(`${BASE_URL}/desks/${deskId}/book`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ book }),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.detail || 'Failed to book desk')
  }
  return res.json() // Updated Desk object
}
