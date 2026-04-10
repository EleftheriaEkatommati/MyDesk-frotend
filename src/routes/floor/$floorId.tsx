import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import {
  bookDesk,
  getDesksByFloor,
  getFloor,
  NotFoundError,
  unbookDesk,
  type Desk,
} from '../../api'
import { useAuth } from '../../auth'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/floor/$floorId')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      date: typeof search.date === 'string' ? search.date : undefined,
    }
  },
  loader: async ({ params, search }) => {
    const numericFloorId = parseInt(params.floorId)
    const dateParam = (search as { date?: string })?.date || new Date().toISOString().split('T')[0]
    
    try {
      // Fetch floor and desks in parallel for speed
      const [floor, floorDesks] = await Promise.all([
        getFloor(numericFloorId),
        getDesksByFloor(numericFloorId, dateParam),
      ])
      return { floor, floorDesks, date: dateParam }
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
  const { floor, floorDesks: initialDesks } = Route.useLoaderData()
  const search = Route.useSearch()
  const [desks, setDesks] = useState<Desk[]>(initialDesks)
  const [loading, setLoading] = useState(false)

  const currentDate = (search as { date?: string })?.date || new Date().toISOString().split('T')[0]

  // Refetch desks when the date in search params changes
  useEffect(() => {
    setLoading(true)
    getDesksByFloor(floor.id, currentDate)
      .then(setDesks)
      .finally(() => setLoading(false))
  }, [currentDate, floor.id])

  const totalDesks = desks.length
  const bookedDesks = desks.filter((d) => d.isBooked).length
  const availableDesks = totalDesks - bookedDesks

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{floor.floorName} Details</h2>

      <div className="mb-6">
        <p className="text-lg">Floor Number: {floor.floorNumber}</p>
        <p className="text-lg">Total Desks: {totalDesks}</p>
        <p className="text-lg">Available: {availableDesks}</p>
        <p className="text-lg">Booked: {bookedDesks}</p>
      </div>

      <FloorPlan desks={desks} setDesks={setDesks} date={currentDate} />
    </div>
  )
}

function FloorPlan({
  desks,
  setDesks,
  date,
}: {
  desks: Desk[]
  setDesks: React.Dispatch<React.SetStateAction<Desk[]>>
  date: string
}) {
  const { user, token } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleToggleBooking = async (desk: Desk) => {
    if (!user || !token) {
      setError('You must be logged in to book a desk.')
      setTimeout(() => setError(null), 3000)
      return
    }

    const isBooking = !desk.isBooked

    // A user can only unbook their own desk
    if (!isBooking && desk.bookedBy !== parseInt(user.id, 10)) {
      setError('This desk is booked by someone else.')
      setTimeout(() => setError(null), 3000)
      return
    }

    const originalDesks = [...desks]

    // Optimistic update
    setDesks((prev) =>
      prev.map((d) =>
        d.id === desk.id
          ? {
              ...d,
              isBooked: isBooking,
              bookedBy: isBooking ? parseInt(user.id, 10) : undefined,
            }
          : d,
      ),
    )

    try {
      if (isBooking) {
        await bookDesk(desk.id, user.id, token,date)
      } else {
        await unbookDesk(desk.id, token)
      }
      // On success, invalidate to get fresh data from server
      router.invalidate()
    } catch (err) {
      // Revert on error
      setDesks(originalDesks)
      setError((err as Error).message)
      setTimeout(() => setError(null), 3000)
    }
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-4">Interactive Floor Plan</h3>

      {/* Blueprint Container */}
      <div
        className="relative w-[800px] h-[600px] bg-slate-50 dark:bg-slate-900 border-4 border-slate-800 dark:border-slate-400 rounded-lg shadow-2xl overflow-hidden
                      bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)]
                      dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)]
                      bg-[size:20px_20px]"
      >
        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce z-10">
            {error}
          </div>
        )}

        {/* Bookable Desks */}
        {desks.map((desk) => {
          const isBookedByOther =
            desk.isBooked && desk.bookedBy !== parseInt(user?.id ?? '-1', 10)
          const isBookedByYou =
            desk.isBooked && desk.bookedBy === parseInt(user?.id ?? '-1', 10)
          return (
            <div
              key={desk.id}
              className="absolute group"
              style={{
                left: desk.x,
                top: desk.y,
                transform: `rotate(${desk.rotation}deg)`,
              }}
            >
              <button
                onClick={() => handleToggleBooking(desk)}
                disabled={isBookedByOther}
                className={`flex flex-col items-center justify-center outline-none transition-transform duration-200 group-hover:scale-110
                ${isBookedByOther ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div
                  className={`w-16 h-10 rounded shadow-md flex items-center justify-center text-sm font-bold border-2
                    ${
                      isBookedByYou
                        ? 'bg-blue-200 border-blue-400 text-blue-800 dark:bg-blue-900/60 dark:border-blue-600 dark:text-blue-200'
                        : desk.isBooked
                          ? 'bg-red-200 border-red-400 text-red-800 dark:bg-red-900/60 dark:border-red-600 dark:text-red-200'
                          : 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/60 dark:border-emerald-600 dark:text-emerald-200'
                    }`}
                >
                  {isBookedByYou ? 'You' : isBookedByOther ? `Booked` : desk.id}
                </div>
                {/* The Desk's Chair */}
                <div
                  className={`w-8 h-3 rounded-b-full shadow-sm mt-[2px] ${
                    isBookedByYou
                      ? 'bg-blue-400 dark:bg-blue-700'
                      : desk.isBooked
                        ? 'bg-red-400 dark:bg-red-700'
                        : 'bg-emerald-400 dark:bg-emerald-600'
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="mt-8 flex gap-6 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-emerald-100 border-2 border-emerald-400 dark:bg-emerald-900/60 dark:border-emerald-600 rounded-sm" />
            <div className="w-4 h-2 bg-emerald-400 dark:bg-emerald-600 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Available
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-red-200 border-2 border-red-400 dark:bg-red-900/60 dark:border-red-600 rounded-sm" />
            <div className="w-4 h-2 bg-red-400 dark:bg-red-700 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Booked
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-blue-200 border-2 border-blue-400 dark:bg-blue-900/60 dark:border-blue-600 rounded-sm" />
            <div className="w-4 h-2 bg-blue-400 dark:bg-blue-700 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Booked by you
          </span>
        </div>
      </div>
    </div>
  )
}
