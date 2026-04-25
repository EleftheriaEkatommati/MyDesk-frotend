import React, { useState } from 'react'
import Calendar from 'react-calendar'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BookingConfirmationCard } from './BookingConfirmationCard'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  Squares2X2Icon,
  CheckIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/solid'
import {
  createFloor,
  deleteFloor,
  getAttendance,
  getDesksByFloor,
  getFloors,
  getMyBookings,
} from '../api'
import toast from 'react-hot-toast'
import { useAuth } from '../auth'
const getToday = () => {
  const d = new Date()
  return d
}
const today = getToday()

const getTomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d
}
const tomorrow = getTomorrow()
function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const BookingCalendar: React.FC = () => {
  const { user, token } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(getToday())
  const isAdmin = user?.role?.name === 'admin'
  const queryClient = useQueryClient()

  const { data: floors, isLoading: floorsLoading } = useQuery({
    queryKey: ['floors'],
    queryFn: getFloors,
  })

  const selectedDateString = formatDate(selectedDate)

  const { data: myBookingResult } = useQuery({
    queryKey: ['myBooking', selectedDateString],
    queryFn: () => getMyBookings(token!, selectedDateString),
    enabled: !!token,
  })
  const myBooking = myBookingResult?.[0]

  const { data: attendance } = useQuery({
    queryKey: ['attendance', selectedDateString],
    queryFn: () => getAttendance(token!, selectedDateString),
    enabled: !!token,
  })

  // Fetch desks for each floor individually to ensure we can calculate stats correctly.
  const floorDeskQueries = useQueries({
    queries: (floors ?? []).map((floor) => ({
      queryKey: ['desksByFloor', floor.id, selectedDateString],
      queryFn: () => getDesksByFloor(floor.id, selectedDateString),
      enabled: !!floors, // Only run queries when floors have been loaded.
    })),
  })

  const desksLoading =
    floorsLoading || floorDeskQueries.some((q) => q.isLoading)
  const queryError = floorDeskQueries.find((q) => q.error)?.error

  if (desksLoading) return <div className="p-4">Loading...</div>
  if (queryError) {
    console.error('Desks query error:', queryError)
    return (
      <div className="p-4 text-red-500">
        Error loading desks: {String(queryError)}
      </div>
    )
  }
  if (!floors) return <div className="p-4 text-red-500">No floors data</div>

  // Calculate stats for each floor directly from the results of useQueries.
  // This is more robust than flattening and re-filtering.
  const floorStats = floors.map((floor, index) => {
    const queryResult = floorDeskQueries[index]
    const floorDesks =
      queryResult?.isSuccess && queryResult.data ? queryResult.data : []
    const total = floorDesks.length
    const booked = floorDesks.filter((d) => d.isBooked).length
    const available = total - booked
    return { ...floor, total, booked, available }
  })

  // Calculate overall statistics by aggregating the per-floor stats.
  const totalDesks = floorStats.reduce((sum, stat) => sum + stat.total, 0)
  const bookedDesks = floorStats.reduce((sum, stat) => sum + stat.booked, 0)
  const occupancyRate = totalDesks > 0 ? (bookedDesks / totalDesks) * 100 : 0
  const availableDesks = totalDesks - bookedDesks

  const handleDeleteFloor = async (floorId: number) => {
    if (!token || !isAdmin) return
    if (
      !window.confirm(
        'Are you sure you want to delete this floor? This will delete all desks and cancel all bookings on this floor. This action cannot be undone.',
      )
    ) {
      return
    }
    try {
      await deleteFloor(floorId, token)
      toast.success('Floor deleted successfully.')
      await queryClient.invalidateQueries({ queryKey: ['floors'] })
      // Also need to invalidate desks for the current date as stats will change
      await queryClient.invalidateQueries({ queryKey: ['desksByFloor'] })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete floor.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-8">
      {isAdmin && <CreateFloorForm />}
      {/* --- Booking Confirmation Card --- */}
      {myBooking && <BookingConfirmationCard booking={myBooking} />}

      {/* --- Stats --- */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Total Desks */}
        <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 py-5 shadow-sm border border-slate-200 dark:border-slate-700 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Squares2X2Icon
                className="h-8 w-8 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Desks
              </dt>
              <dd className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {totalDesks}
              </dd>
            </div>
          </div>
        </div>
        {/* Booked Desks */}
        <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 py-5 shadow-sm border border-slate-200 dark:border-slate-700 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon
                className="h-8 w-8 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                Booked Desks
              </dt>
              <dd className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {bookedDesks}
              </dd>
            </div>
          </div>
        </div>
        {/* Available Desks */}
        <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 py-5 shadow-sm border border-slate-200 dark:border-slate-700 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon
                className="h-8 w-8 text-green-500"
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                Available Desks
              </dt>
              <dd className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {availableDesks}
              </dd>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
            Select a Date
          </h3>
          <style>
            {/* 
              We are defining custom calendar styles here to override the default
              and provide a consistent look for both light and dark modes.
            */}
            {` 
              /* Base Calendar Styles (Light Mode) */
              .react-calendar {
                width: 100%;
                background: white;
                border: 1px solid #e2e8f0; /* slate-200 */
                border-radius: 0.75rem;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                font-family: inherit;
                padding: 0.5rem;
              }

              .react-calendar__navigation button {
                color: #475569; /* slate-600 */
                min-width: 44px;
                background: none;
                font-size: 1rem;
                margin-top: 8px;
                font-weight: 600;
                border-radius: 0.5rem;
              }

              .react-calendar__navigation__label {
                color: #1e293b; /* slate-800 */
                font-weight: 700;
              }

              .react-calendar__navigation button:enabled:hover,
              .react-calendar__navigation button:enabled:focus {
                background-color: #f1f5f9; /* slate-100 */
              }

              .react-calendar__month-view__weekdays {
                text-align: center;
                text-transform: uppercase;
                font-weight: 600;
                font-size: 0.75em;
                color: #64748b; /* slate-500 */
                padding-bottom: 0.5rem;
              }

              .react-calendar__tile {
                max-width: 100%;
                padding: 10px 6.6667px;
                background: none;
                text-align: center;
                line-height: 16px;
                border-radius: 0.75rem;
                color: #334155; /* slate-700 */
              }

              .react-calendar__tile:disabled {
                color: #cbd5e1; /* slate-300 */
                background-color: transparent;
              }

              .react-calendar__tile:enabled:hover,
              .react-calendar__tile:enabled:focus {
                background-color: #f1f5f9; /* slate-100 */
              }

              .react-calendar__tile--now {
                background: #bfdbfe; /* blue-200 */
                font-weight: bold;
                color: #1e3a8a; /* blue-900 */
              }

              .react-calendar__tile--active {
                background: #2563eb; /* blue-600 */
                color: white;
                font-weight: bold;
              }

              .react-calendar__month-view__days__day--neighboringMonth {
                color: #94a3b8; /* slate-400 */
              }

              /* Dark Mode Overrides */
              @media (prefers-color-scheme: dark) {
                .react-calendar {
                  background: #1e293b; /* slate-800 */
                  border-color: #334155; /* slate-700 */
                }
                .react-calendar__navigation button { color: #cbd5e1; /* slate-300 */ }
                .react-calendar__navigation__label { color: white; }
                .react-calendar__navigation button:disabled { color: #475569; /* slate-600 */ }
                .react-calendar__navigation button:enabled:hover,
                .react-calendar__navigation button:enabled:focus { background-color: #334155; /* slate-700 */ }
                .react-calendar__month-view__weekdays { color: #94a3b8; /* slate-400 */ }
                .react-calendar__tile { color: #e2e8f0; /* slate-200 */ }
                .react-calendar__tile:disabled { color: #475569; /* slate-600 */ }
                .react-calendar__tile:enabled:hover,
                .react-calendar__tile:enabled:focus { background-color: #334155; /* slate-700 */ }
                .react-calendar__tile--now { background: #0c4a6e; /* sky-900 */ color: #e0f2fe; /* sky-100 */ }
                .react-calendar__tile--active { background: #2563eb; /* blue-600 */ color: white; }
                .react-calendar__month-view__days__day--neighboringMonth { color: #64748b; /* slate-500 */ }
              }
            `}
          </style>
          <Calendar
            onChange={(value) => setSelectedDate(value as Date)}
            value={selectedDate}
            minDate={today}
          />
          <p className="mt-2">Selected date: {selectedDate.toDateString()}</p>
          {/* Note: Historical data per date not available in current API */}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
            Floor Overview for {selectedDateString}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {floorStats?.map((stat) => {
              let bgColor = 'bg-green-500'
              let Icon = CheckCircleIcon
              if (stat.total > 0 && stat.booked === stat.total) {
                bgColor = 'bg-red-800'
                Icon = XCircleIcon
              } else if (stat.total > 0 && stat.booked >= stat.total / 2) {
                bgColor = 'bg-orange-500'
                Icon = ExclamationTriangleIcon
              }
              console.log('SELECTED DATE:', selectedDateString)
              return (
                <div key={stat.id} className="relative">
                  <Link
                    from="/"
                    to="/floor/$floorId"
                    params={{ floorId: stat.id.toString() }}
                    search={{ date: selectedDateString }}
                    className={`block p-4 rounded-lg ${bgColor} text-white shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg">{stat.floor_name}</h4>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-base space-y-2 bg-white/10 rounded-md p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Squares2X2Icon className="h-5 w-5" />
                          <span className="font-semibold">Total:</span>
                        </div>
                        <span className="font-bold">{stat.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckIcon className="h-5 w-5" />
                          <span className="font-semibold">Available:</span>
                        </div>
                        <span className="font-bold">{stat.available}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-5 w-5" />
                          <span className="font-semibold">Booked:</span>
                        </div>
                        <span className="font-bold">{stat.booked}</span>
                      </div>
                    </div>
                  </Link>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteFloor(stat.id)
                      }}
                      title="Delete Floor"
                      className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-sm text-white shadow-md transition-all hover:scale-110 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
              Who's In Today ({selectedDateString})
            </h3>

            {attendance?.length === 0 ? (
              <div className="text-center py-10 px-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <UserIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-200">
                  No one checked in
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  No one has checked in for this date yet.
                </p>
              </div>
            ) : (
              <ul
                role="list"
                className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                {attendance?.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-x-6 p-4"
                  >
                    <div className="flex min-w-0 gap-x-4">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <span className="font-bold text-slate-500 dark:text-slate-400">
                          {b.user?.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-100">
                          {b.user?.name} {b.user?.surname}
                        </p>
                        <p className="mt-1 truncate text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {b.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex sm:flex-col sm:items-end">
                      <p className="text-sm leading-6 text-slate-900 dark:text-slate-100">
                        {b.desk?.floor?.floor_name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Desk {b.desk?.id}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateFloorForm() {
  const [floorNumber, setFloorNumber] = useState('')
  const [floorName, setFloorName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !floorNumber) {
      toast.error('Floor number is required.')
      return
    }
    setIsCreating(true)
    try {
      await createFloor(
        {
          floorNumber: Number(floorNumber),
          floorName: floorName || undefined,
        },
        token,
      )
      toast.success('Floor created successfully!')
      setFloorNumber('')
      setFloorName('')
      await queryClient.invalidateQueries({ queryKey: ['floors'] })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create floor.'
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="mb-8 p-6 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
        Create New Floor
      </h3>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4 items-end"
      >
        <div className="flex-1">
          <label
            htmlFor="floorNumber"
            className="block text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            Floor Number (Required)
          </label>
          <input
            id="floorNumber"
            type="number"
            value={floorNumber}
            onChange={(e) => setFloorNumber(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="floorName"
            className="block text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            Floor Name (Optional)
          </label>
          <input
            id="floorName"
            type="text"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-lg sm:w-auto hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {isCreating ? 'Creating...' : 'Create Floor'}
        </button>
      </form>
    </div>
  )
}

export default BookingCalendar
