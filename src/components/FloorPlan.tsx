import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  bookDesk,
  unbookDesk,
  type Booking,
  type Desk,
  type User,
} from '../api'
import { useAuth } from '../auth'

export function FloorPlan({
  desks,
  setDesks,
  date,
  userMap,
}: {
  desks: Desk[]
  setDesks: React.Dispatch<React.SetStateAction<Desk[]>>
  date: string
  userMap: Map<number, User> | null
}) {
  const { user, token } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [recentBooking, setRecentBooking] = useState<Booking | null>(null)
  const router = useRouter()

  const currentUserId = String(user?.id ?? '-1')
  const hasBookedADesk = desks.some(
    (d) => d.isBooked && String(d.bookedBy) === currentUserId,
  )

  const handleToggleBooking = async (desk: Desk) => {
    if (!user || !token) {
      setError('You must be logged in to book a desk.')
      setTimeout(() => setError(null), 3000)
      return
    }

    const isBooking = !desk.isBooked

    if (isBooking && hasBookedADesk) {
      setError('You have already booked a desk. Unbook it first.')
      setTimeout(() => setError(null), 3000)
      return
    }

    // A user can only unbook their own desk
    if (!isBooking && String(desk.bookedBy) !== currentUserId) {
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
              bookedBy: isBooking ? currentUserId : null,
            }
          : d,
      ),
    )

    try {
      if (isBooking) {
        const booking = await bookDesk(desk.id, token, date)
        setRecentBooking(booking)
        setDesks((prev) =>
          prev.map((d) =>
            d.id === desk.id ? { ...d, bookingId: booking.id } : d,
          ),
        )
      } else {
        if (!desk.bookingId) {
          throw new Error('Cannot cancel: missing booking ID.')
        }
        await unbookDesk(desk.bookingId, token)
        if (recentBooking?.desk_id === desk.id) {
          setRecentBooking(null)
        }
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

  // DEBUG: Let's see exactly what the backend is telling the frontend!
  console.log('Current Desks Data:', desks)

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-4">Interactive Floor Plan</h3>

      {/* Informational Banner */}
      {hasBookedADesk && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
          <span className="text-xl">ℹ️</span>
          <p>
            You already have a desk booked for this date. You must unbook it
            before you can book a different desk.
          </p>
        </div>
      )}

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
          const isBookedByYou =
            desk.isBooked && String(desk.bookedBy) === currentUserId
          const isBookedByOther = desk.isBooked && !isBookedByYou
          const isDisabled =
            isBookedByOther || (hasBookedADesk && !isBookedByYou)

          let bookingUser: User | undefined
          if (isBookedByOther && userMap && desk.bookedBy) {
            bookingUser = userMap.get(Number(desk.bookedBy))
          }

          const deskLabel = isBookedByYou
            ? 'You'
            : isBookedByOther
              ? bookingUser?.name || 'Booked'
              : desk.id

          const tooltipText =
            isBookedByOther && bookingUser
              ? `${bookingUser.name} ${bookingUser.surname || ''} (${bookingUser.email})`
              : undefined

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
                disabled={isDisabled}
                className={`flex flex-col items-center justify-center outline-none transition-transform duration-200 group-hover:scale-110 ${
                  isDisabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                }`}
                title={tooltipText}
              >
                <div
                  className={`w-16 h-10 rounded shadow-md flex items-center justify-center text-sm font-bold border-2 truncate px-1
                    ${
                      isBookedByYou
                        ? 'bg-blue-200 border-blue-400 text-blue-800 dark:bg-blue-900/60 dark:border-blue-600 dark:text-blue-200'
                        : desk.isBooked
                          ? 'bg-red-200 border-red-400 text-red-800 dark:bg-red-900/60 dark:border-red-600 dark:text-red-200'
                          : 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/60 dark:border-emerald-600 dark:text-emerald-200'
                    }`}
                >
                  {deskLabel}
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

      {/* Booking Confirmation Card */}
      {recentBooking && (
        <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-md w-[800px]">
          <h3 className="text-xl font-bold mb-4 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <span>🎉</span> Booking Confirmed!
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Booking ID
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                #{recentBooking.id}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Desk</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {recentBooking.desk_id}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Date</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {recentBooking.booking_date}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Status
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                {recentBooking.status}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
