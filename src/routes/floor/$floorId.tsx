import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  getDesksByFloor,
  getFloor,
  getUsers,
  NotFoundError,
  type Desk,
  type User,
} from '../../api'
import { useEffect, useMemo, useState } from 'react'
import { FloorPlan } from '../../components/FloorPlan'

function getLocalDateString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

type FloorSearch = {
  date?: string
}

export const Route = createFileRoute('/floor/$floorId')({
  validateSearch: (search: Record<string, unknown>) => ({
    date:
      typeof search.date === 'string' && search.date.trim().length > 0
        ? search.date
        : getLocalDateString(),
  }),
  loader: async ({ params, location, context }) => {
    const { auth } = context
    const numericFloorId = Number(params.floorId)
    const search = location.search as FloorSearch | undefined
    console.log('Floor loader search object:', search)
    const dateParam = search?.date ?? getLocalDateString()
    console.log('Date parameter for loader:', dateParam)
    try {
      // Fetch floor and desks in parallel for speed
      const [floor, floorDesks] = await Promise.all([
        getFloor(numericFloorId),
        getDesksByFloor(numericFloorId, dateParam),
      ])

      let users: User[] | null = null
      // If user is admin, fetch all users to display their names on booked desks
      if (
        auth.isAuthenticated &&
        auth.user?.role?.name === 'admin' &&
        auth.token
      ) {
        try {
          users = await getUsers(auth.token)
        } catch (userError) {
          console.error('Failed to fetch users for admin:', userError)
          // Non-critical, so we can continue without the user list
        }
      }

      return { floor, floorDesks, date: dateParam, users }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw notFound()
      }
      throw error // Re-throw other errors for the error boundary
    }
  },
  component: FloorDetail,
  pendingComponent: () => <div className="p-4">Loading...</div>,
  notFoundComponent: () => <div className="p-4">Floor not found</div>,
})

function FloorDetail() {
  const { floor, floorDesks: initialDesks, users, date } = Route.useLoaderData()
  console.log('Loader date in component:', date)
  const currentDate = date || getLocalDateString()
  const [desks, setDesks] = useState<Desk[]>(initialDesks)
  // Sync local state with fresh loader data (e.g. after router.invalidate() or date change)
  useEffect(() => {
    setDesks(initialDesks)
  }, [initialDesks])

  // Create a map for quick user lookup, only if users data is available
  const userMap = useMemo(() => {
    if (!users) return null
    return new Map(users.map((u) => [u.id, u]))
  }, [users])

  const totalDesks = desks.length
  const bookedDesks = desks.filter((d) => d.isBooked).length
  const availableDesks = totalDesks - bookedDesks

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{floor.floor_name} Details</h2>

      <div className="mb-6">
        <p className="text-lg">Floor Number: {floor.floor_number}</p>
        <p className="text-lg">Total Desks: {totalDesks}</p>
        <p className="text-lg">Available: {availableDesks}</p>
        <p className="text-lg">Booked: {bookedDesks}</p>
      </div>

      <FloorPlan
        desks={desks}
        setDesks={setDesks}
        date={currentDate}
        userMap={userMap}
      />
    </div>
  )
}