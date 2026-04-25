import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth'
import toast from 'react-hot-toast'
import { unbookDesk, type Booking } from '../api'
import {
  CalendarDaysIcon,
  MapPinIcon,
  TicketIcon,
} from '@heroicons/react/24/solid'

export function BookingConfirmationCard({ booking }: { booking: Booking }) {
  const { token } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = async () => {
    if (!token) return
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setIsCancelling(true)

    // Optimistically update the UI by removing the booking from the query cache.
    // This makes the card disappear instantly.
    queryClient.setQueryData(['myBooking', booking.booking_date], [])

    try {
      await unbookDesk(booking.id, token)
      toast.success('Booking cancelled successfully!')
      // Invalidate all data to ensure consistency after the optimistic update.
      // This will correctly update the desk status on the floor plan and stats on the homepage.
      router.invalidate()
    } catch (err) {
      // On error, revert the optimistic update by refetching the original data.
      queryClient.invalidateQueries({
        queryKey: ['myBooking', booking.booking_date],
      })
      const message =
        err instanceof Error ? err.message : 'Failed to cancel booking.'
      toast.error(message)
    } finally {
      setIsCancelling(false)
    }
  }

  // A booking can be cancelled if it is 'confirmed' or 'active'.
  // Past bookings can also be cancelled, unless they were checked-in or already cancelled.
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // The booking date is a string 'YYYY-MM-DD'. We need to parse it carefully
  // to avoid timezone issues.
  const dateParts = booking.booking_date.split('-').map(Number)
  const bookingDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])

  const isPast = bookingDate < today
  const lowerCaseStatus = booking.status.toLowerCase()
  // A booking can be cancelled if it's 'confirmed', or if it's 'active' and not in the past.
  const canCancel =
    lowerCaseStatus === 'confirmed' || (lowerCaseStatus === 'active' && !isPast)

  const getCancelTitle = () => {
    if (canCancel) {
      return 'Cancel this booking'
    }
    if (lowerCaseStatus === 'cancelled') {
      return 'This booking has already been cancelled.'
    }
    if (lowerCaseStatus === 'checked_in') {
      return 'This booking has been checked in and cannot be cancelled.'
    }
    return 'This booking cannot be cancelled.'
  }

  const getCardInfo = () => {
    switch (lowerCaseStatus) {
      case 'confirmed':
      case 'active':
        return {
          title: 'Booking Confirmed!',
          message: 'You have a desk reserved for the selected date.',
          gradient: 'from-blue-500 to-indigo-600',
        }
      case 'cancelled':
        return {
          title: 'Booking Cancelled',
          message: 'This booking is no longer active.',
          gradient: 'from-slate-500 to-slate-600',
        }
      case 'checked_in':
        return {
          title: 'Checked In!',
          message: 'You are checked in for this booking.',
          gradient: 'from-green-500 to-emerald-600',
        }
      default:
        return {
          title: 'Booking Status',
          message: `This booking has a status of: ${lowerCaseStatus.replace(
            '_',
            ' ',
          )}`,
          gradient: 'from-gray-500 to-gray-600',
        }
    }
  }

  const cardInfo = getCardInfo()

  if (!booking.desk) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-100/10 rounded-lg">
        Booking information is incomplete.
      </div>
    )
  }

  return (
    <div
      className={`mb-8 bg-gradient-to-br ${cardInfo.gradient} text-white rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">{cardInfo.title}</h3>
          <TicketIcon className="h-8 w-8 opacity-75" />
        </div>
        <p className="mt-1 opacity-80">{cardInfo.message}</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
          <div className="flex items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <MapPinIcon className="h-8 w-8 flex-shrink-0 opacity-75" />
            <div>
              <span className="opacity-80 text-sm">Location</span>
              <p className="font-bold leading-tight">
                Floor {booking.desk.floorId}: {booking.desk.floor?.floor_name}
              </p>
              <p className="opacity-90">Desk {booking.desk.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <CalendarDaysIcon className="h-8 w-8 flex-shrink-0 opacity-75" />
            <div>
              <span className="opacity-80 text-sm">Date</span>
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
      <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 bg-black/20 px-6 py-4 backdrop-blur-sm sm:flex-row">
        <Link
          to="/floor/$floorId"
          params={{ floorId: booking.desk.floorId.toString() }}
          search={{ date: booking.booking_date }}
          className="font-semibold hover:underline"
        >
          View on Floor Plan &rarr;
        </Link>
        <button
          onClick={handleCancel}
          disabled={!canCancel || isCancelling}
          className="w-full px-4 py-2 font-bold text-white bg-red-600 rounded-lg sm:w-auto hover:bg-red-700 focus:ring-4 focus:ring-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={getCancelTitle()}
        >
          {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
        </button>
      </div>
    </div>
  )
}
