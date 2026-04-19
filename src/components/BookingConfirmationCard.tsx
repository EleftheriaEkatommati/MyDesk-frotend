import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useAuth } from '../auth'
import { unbookDesk, type Booking } from '../api'
import {
  CalendarDaysIcon,
  MapPinIcon,
  TicketIcon,
} from '@heroicons/react/24/solid'

export function BookingConfirmationCard({ booking }: { booking: Booking }) {
  const { token } = useAuth()
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    if (!token) return
    setIsCancelling(true)
    setError(null)
    try {
      await unbookDesk(booking.id, token)
      // Invalidate router to refetch all data and remove this card
      router.invalidate()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to cancel booking.'
      setError(message)
      setTimeout(() => setError(null), 4000)
    } finally {
      setIsCancelling(false)
    }
  }

  // A booking can be cancelled if it is 'confirmed'.
  const canCancel = booking.status === 'confirmed'

  if (!booking.desk) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-100/10 rounded-lg">
        Booking information is incomplete.
      </div>
    )
  }

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">Your Booking is Confirmed!</h3>
          <TicketIcon className="h-8 w-8 opacity-75" />
        </div>
        <p className="mt-1 text-blue-200">
          You have a desk reserved for the selected date.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          <div className="flex items-center gap-3">
            <MapPinIcon className="h-6 w-6 text-blue-300" />
            <div>
              <span className="text-blue-200 text-sm">Desk / Floor</span>
              <p className="font-bold">
                {booking.desk.id} / {booking.desk.floor?.floor_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="h-6 w-6 text-blue-300" />
            <div>
              <span className="text-blue-200 text-sm">Date</span>
              <p className="font-bold">
                {new Date(booking.booking_date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC', // Important to avoid off-by-one day errors
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/floor/$floorId"
          params={{ floorId: booking.desk.floorId.toString() }}
          search={{ date: booking.booking_date }}
          className="font-semibold hover:underline"
        >
          View on Floor Plan &rarr;
        </Link>
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="px-4 py-2 font-bold text-red-600 bg-white rounded-lg hover:bg-red-50 focus:ring-4 focus:ring-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}
      </div>
      {error && (
        <div className="p-2 text-sm text-center text-red-200 bg-red-900/50">
          {error}
        </div>
      )}
    </div>
  )
}
