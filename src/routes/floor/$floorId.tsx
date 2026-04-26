import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  getDesksByFloor,
  getFloor,
  getUsers,
  getMyBookings,
  NotFoundError,
  type Desk,
  type User,
} from '../../api'
import { useEffect, useMemo, useState } from 'react'
import { FloorRenderer } from '../../components/FloorRenderer'
import { useQuery } from '@tanstack/react-query'
import { BookingConfirmationCard } from '../../components/BookingConfirmationCard'

function getLocalDateString() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

type FloorSearch = {
  date?: string
}

export const Route = createFileRoute('/floor/$floorId')({
  validateSearch: (search: Record<string, unknown>): FloorSearch => ({
    date:
      typeof search.date === 'string' && search.date.trim()
        ? search.date
        : getLocalDateString(),
  }),

  loader: async ({ params, location, context }) => {
    const { auth } = context
    const floorId = Number(params.floorId)
    const search = location.search as FloorSearch | undefined
    const date = search?.date ?? getLocalDateString()

    try {
      const [floor, floorDesks] = await Promise.all([
        getFloor(floorId),
        getDesksByFloor(floorId, date),
      ])

      let users: User[] | null = null

      if (auth.user?.role?.name === 'admin' && auth.token) {
        users = await getUsers(auth.token)
      }

      return { floor, floorDesks, users, date }
    } catch (e) {
      if (e instanceof NotFoundError) throw notFound()
      throw e
    }
  },

  component: FloorDetail,
})

function FloorDetail() {
  const { floor, floorDesks, users, date } = Route.useLoaderData()
  const { auth } = Route.useRouteContext()

  const { data: myBookingResult } = useQuery({
    queryKey: ['myBooking', date],
    queryFn: () => getMyBookings(auth.token!, date),
    enabled: !!auth.token,
  })
  const myBooking = myBookingResult?.[0]

  const [desks, setDesks] = useState<Desk[]>(floorDesks)

  useEffect(() => {
    setDesks(floorDesks)
  }, [floorDesks])

  const userMap = useMemo(() => {
    if (!users) return null
    return new Map(users.map((u) => [u.id, u]))
  }, [users])
  console.log('Status of myBooking:', myBooking?.status)
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">{floor?.floorName}</h2>

      {/* --- Booking Confirmation Card --- */}
      {myBooking && <BookingConfirmationCard booking={myBooking} />}

      <div className="w-full pb-4 flex flex-col items-center">
        <FloorRenderer
          desks={desks}
          setDesks={setDesks}
          date={date}
          floorId={floor?.id}
          userMap={userMap}
          myBooking={myBooking}
        />
      </div>
    </div>
  )
}
