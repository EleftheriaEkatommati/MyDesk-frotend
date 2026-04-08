import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { bookDesk, getDesks, type Desk } from '../api'
import { useAuth } from '../auth'

export const Route = createFileRoute('/the-plan')({
  component: ThePlan,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
        replace: true,
      })
    }
  },
})

function ThePlan() {
  const [desks, setDesks] = useState<Desk[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    getDesks().then(setDesks)
  }, [])

  const handleBook = async (desk: Desk) => {
    if (!user) return

    const originalDesks = [...desks]
    const newBookingStatus = !desk.isBooked

    // Optimistic update
    setDesks((prev) =>
      prev.map((d) =>
        d.id === desk.id
          ? { ...d, isBooked: newBookingStatus, bookedBy: user.id }
          : d,
      ),
    )

    try {
      await bookDesk(desk.id, newBookingStatus, user.token)
    } catch (err) {
      // Revert on error
      setDesks(originalDesks)
      setError((err as Error).message)
      setTimeout(() => setError(null), 3000)
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-extrabold mb-8 text-slate-800 dark:text-white">
        Floor Plan
      </h1>

      {/* Blueprint Container */}
      <div
        className="relative w-[800px] h-[600px] bg-slate-50 dark:bg-slate-900 border-4 border-slate-800 dark:border-slate-400 rounded-lg shadow-2xl overflow-hidden
                      bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)]
                      dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)]
                      bg-[size:20px_20px]"
      >
        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce">
            {error}
          </div>
        )}
        {/* Meeting Room (Top Right) */}
        <div className="absolute top-0 right-0 w-[300px] h-[250px] border-l-[6px] border-b-[6px] border-slate-800 dark:border-slate-400 bg-blue-100/40 dark:bg-blue-900/20 flex items-center justify-center">
          <span className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 font-bold tracking-widest text-xl">
            MEETING
          </span>
          <div className="w-48 h-20 border-4 border-slate-400 dark:border-slate-600 rounded-full flex items-center justify-center">
            <div className="flex gap-8">
              <div className="w-4 h-4 bg-slate-400 dark:bg-slate-600 rounded-full" />
              <div className="w-4 h-4 bg-slate-400 dark:bg-slate-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Private Office (Bottom Left) */}
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] border-t-[6px] border-r-[6px] border-slate-800 dark:border-slate-400 bg-amber-100/40 dark:bg-amber-900/20 flex items-center justify-center">
          <span className="absolute bottom-4 left-4 text-slate-400 dark:text-slate-500 font-bold tracking-widest text-xl">
            OFFICE
          </span>
        </div>

        {/* Entrance Door */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-slate-500 dark:text-slate-400 font-bold tracking-widest mb-1 text-sm">
            ENTRANCE
          </span>
          <div className="w-32 h-2 border-b-[6px] border-dashed border-emerald-500"></div>
        </div>

        {/* Bookable Desks */}
        {desks.map((desk) => {
          const isBookedByOther = desk.isBooked && desk.bookedBy !== user?.id
          const isBookedByYou = desk.isBooked && desk.bookedBy === user?.id
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
                onClick={() => handleBook(desk)}
                disabled={isBookedByOther}
                className={`flex flex-col items-center justify-center outline-none transition-transform duration-200 group-hover:scale-110
                ${desk.isBooked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
