import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { authService, useAuth } from '../auth'
import {
  getDailyReport,
  type Booking,
  type DailyReport,
  type User,
} from '../api'
import {
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ClockIcon,
  Squares2X2Icon,
  XCircleIcon,
} from '@heroicons/react/24/solid'

export const Route = createFileRoute('/statistics')({
  beforeLoad: async ({ context }) => {
    await context.auth.ensureLoaded()
    const auth = authService.getState()

    if (!auth.user || auth.user.role?.name !== 'admin') {
      throw redirect({ to: '/login' })
    }
  },
  component: StatisticsPage,
})

// Helper component for a single stat card
const StatCard = ({
  title,
  value,
  Icon,
  color,
}: {
  title: string
  value: string | number
  Icon: React.ElementType
  color: string
}) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center transition-transform hover:-translate-y-1">
    <div
      className={`p-3 rounded-lg mr-4 ${color.replace(
        'text-',
        'bg-',
      )}/10 dark:${color.replace('text-', 'bg-')}/20`}
    >
      <Icon className={`h-6 w-6 ${color}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {title}
      </p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  </div>
)

// Helper component for the bookings table
const BookingsTable = ({
  title,
  bookings,
}: {
  title: string
  bookings: Booking[]
}) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
    <h3 className="text-lg font-semibold p-4 border-b border-slate-200 dark:border-slate-700">
      {title} ({bookings.length})
    </h3>
    {bookings.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                User
              </th>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Desk
              </th>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Floor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {booking.user?.name} {booking.user?.surname}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                  {booking.desk?.id ?? 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                  {booking.desk?.floor?.floorName ?? 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="p-8 text-center text-slate-500">
        No users in this category.
      </p>
    )}
  </div>
)

// Helper component for a simple user list table
const UsersTable = ({ title, users }: { title: string; users: User[] }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
    <h3 className="text-lg font-semibold p-4 border-b border-slate-200 dark:border-slate-700">
      {title} ({users.length})
    </h3>
    {users.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                User
              </th>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Email
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {user.name} {user.surname}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                  {user.email}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="p-8 text-center text-slate-500">
        All users have a booking.
      </p>
    )}
  </div>
)

function StatisticsPage() {
  const { token } = useAuth()

  const {
    data: report,
    error,
    isLoading,
  } = useQuery<DailyReport, Error>({
    queryKey: ['dailyReport'],
    queryFn: () => getDailyReport(token!),
    enabled: !!token,
    refetchInterval: 30000, // Poll every 30 seconds
  })

  if (isLoading) {
    return <div className="text-center p-8">Loading daily report...</div>
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">Error: {error.message}</div>
    )
  }

  if (!report) {
    return <div className="text-center p-8">No report data available.</div>
  }

  const {
    stats,
    checked_in_bookings,
    pending_bookings,
    users_with_no_booking,
  } = report

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Daily Report for {new Date().toLocaleDateString()}
      </h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Expected Today"
          value={stats.total_expected}
          Icon={Squares2X2Icon}
          color="text-blue-500"
        />
        <StatCard
          title="Checked In"
          value={stats.checked_in}
          Icon={CheckCircleIcon}
          color="text-green-500"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          Icon={ClockIcon}
          color="text-amber-500"
        />
        <StatCard
          title="Check-in Rate"
          value={`${stats.check_in_percentage}%`}
          Icon={ArrowTrendingUpIcon}
          color="text-indigo-500"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          Icon={XCircleIcon}
          color="text-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <BookingsTable
          title="Checked-In Users"
          bookings={checked_in_bookings || []}
        />
        <BookingsTable
          title="Pending Check-In"
          bookings={pending_bookings || []}
        />
      </div>

      <div className="pt-4">
        <UsersTable
          title="Users Without a Booking"
          users={users_with_no_booking || []}
        />
      </div>
    </div>
  )
}
