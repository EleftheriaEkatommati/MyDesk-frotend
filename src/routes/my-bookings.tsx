import {
  createFileRoute,
  redirect,
  useLoaderData,
  useRouter,
} from '@tanstack/react-router'
import { getMyBookings, unbookDesk, type Booking } from '../api'
import { authService, useAuth } from '../auth'
import { useState } from 'react'
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

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">
        My Bookings
      </h1>
      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-md">
          <p className="text-gray-500 dark:text-gray-400 text-xl">
            You have no bookings yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
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
  }

  const statusStyle = statusStyles[booking.status] || statusStyles.default

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

  // A booking can be cancelled if it is 'confirmed' or 'active' and is for today or a future date.
  // Using string comparison for 'YYYY-MM-DD' format is safe and avoids timezone issues.
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayStr = `${yyyy}-${mm}-${dd}`
  const canCancel =
    (booking.status === 'confirmed' || booking.status === 'active') &&
    booking.booking_date >= todayStr

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Desk{' '}
            <span className="text-blue-500 dark:text-blue-400">
              {booking.desk_id}
            </span>
          </h2>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${statusStyle}`}
          >
            {booking.status}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Date:{' '}
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {new Date(booking.booking_date).toLocaleDateString()}
          </span>
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          Booking ID: {booking.id}
        </p>
      </div>
      {canCancel && (
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full px-4 py-2 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      )}
    </div>
  )
}
