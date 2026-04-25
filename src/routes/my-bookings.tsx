import {
  createFileRoute,
  redirect,
  useLoaderData,
  useRouter,
} from '@tanstack/react-router'
import { getMyBookings, type Booking, unbookDesk } from '../api'
import { CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/solid'
import { authService, useAuth } from '../auth'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/my-bookings')({
  loader: async ({ context }) => {
    await context.auth.ensureLoaded()
    const authState = authService.getState()

    // If user is not authenticated, redirect to login
    if (!authState.user || !authState.token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    // Fetch the user's bookings
    const bookings = await getMyBookings(authState.token)
    return { bookings }
  },
  component: MyBookingsPage,
})

function MyBookingsPage() {
  const { bookings } = useLoaderData({ from: '/my-bookings' })

  const groupedBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {
      Active: [],
      Past: [],
      Cancelled: [],
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Sort all bookings by date descending first to have a consistent base order
    const sortedBookings = [...bookings].sort(
      (a, b) =>
        new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime(),
    )

    for (const booking of sortedBookings) {
      const dateParts = booking.booking_date.split('-').map(Number)
      const bookingDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
      const isPast = bookingDate < today
      const status = booking.status.toLowerCase()

      if (status === 'cancelled') {
        groups.Cancelled.push(booking)
      } else if (isPast) {
        groups.Past.push(booking)
      } else {
        groups.Active.push(booking)
      }
    }

    // Active bookings should be ascending
    groups.Active.reverse()

    return groups
  }, [bookings])

  const groupOrder = ['Active', 'Past', 'Cancelled']

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">
        My Bookings
      </h1>
      {bookings.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center p-16 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <p className="text-gray-500 dark:text-gray-400 text-xl">
              You have no bookings yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {groupOrder.map((groupName) => {
            const groupBookings = groupedBookings[groupName]
            if (groupBookings.length === 0) return null

            return (
              <section key={groupName}>
                <h2 className="text-2xl font-semibold mb-6 pb-2 border-b-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  {groupName}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking }: { booking: Booking }) {
  const { token } = useAuth()
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const statusStyles: Record<string, string> = {
    active:
      'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    confirmed:
      'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300',
    checked_in: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
  }

  const lowerCaseStatus = booking.status.toLowerCase()
  const statusStyle = statusStyles[lowerCaseStatus] || statusStyles.default

  const handleCancel = async () => {
    if (!token) return

    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setIsCancelling(true)
    try {
      await unbookDesk(booking.id, token)
      toast.success('Booking cancelled successfully!')
      // Invalidate the data for this route to refetch bookings
      router.invalidate()
    } catch (err) {
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

  return (
    <div className="flex flex-col overflow-hidden transition-transform duration-300 transform border shadow-lg bg-white dark:bg-slate-800 rounded-2xl hover:-translate-y-1 border-slate-200 dark:border-slate-700">
      <div className="flex-grow p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Booking #{booking.id}
          </h3>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${statusStyle}`}
          >
            {lowerCaseStatus.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <MapPinIcon className="flex-shrink-0 w-5 h-5 mt-0.5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {booking.desk?.floor?.floor_name ?? 'Unknown Floor'}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Desk {booking.desk_id}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDaysIcon className="flex-shrink-0 w-5 h-5 mt-0.5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {new Date(booking.booking_date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={handleCancel}
          disabled={!canCancel || isCancelling}
          className="w-full px-4 py-2 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={getCancelTitle()}
        >
          {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
        </button>
      </div>
    </div>
  )
}
