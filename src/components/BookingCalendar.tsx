import React, { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  Squares2X2Icon,
  CheckIcon,
  UserIcon,
} from '@heroicons/react/24/solid'
import { getDesksByFloor, getFloors } from '../api'
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
  
  const [selectedDate, setSelectedDate] = useState<Date>(getToday())

  const { data: floors, isLoading: floorsLoading } = useQuery({
    queryKey: ['floors'],
    queryFn: getFloors,
  })

  const selectedDateString = formatDate(selectedDate)
  console.log('SELECTED DATE STRING:', selectedDateString)  
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

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200">
        Availability and Booking Calendar
      </h2>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Desks
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalDesks}
          </p>
        </div>
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Booked Desks
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {bookedDesks}
          </p>
        </div>
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Occupancy Rate
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {occupancyRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
            Select a Date
          </h3>
          <style>
            {`
              .react-calendar {
                width: 100%;
                background: #1e293b; /* slate-800 */
                border: 1px solid #334155; /* slate-700 */
                border-radius: 0.5rem; /* rounded-lg */
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); /* shadow-md */
                font-family: inherit;
              }
              .react-calendar__navigation button {
                color: #cbd5e1; /* slate-300 */
                min-width: 44px;
                background: none;
                font-size: 1rem;
                margin-top: 8px;
              }
              .react-calendar__navigation__label {
                color: white;
              }
              .react-calendar__navigation button:enabled:hover,
              .react-calendar__navigation button:enabled:focus {
                background-color: #334155; /* slate-700 */
              }
              .react-calendar__month-view__weekdays {
                text-align: center;
                text-transform: uppercase;
                font-weight: bold;
                font-size: 0.75em;
                color: #94a3b8; /* slate-400 */
              }
              .react-calendar__tile {
                max-width: 100%;
                padding: 10px 6.6667px;
                background: none;
                text-align: center;
                line-height: 16px;
                border-radius: 0.5rem;
                color: #e2e8f0; /* slate-200 */
              }
                .react-calendar__tile:disabled {
                  color: #475569; /* slate-600 */
                  background-color: transparent;
                }
                .react-calendar__tile:enabled:hover,
                .react-calendar__tile:enabled:focus {
                  background-color: #334155; /* slate-700 */
                }
                .react-calendar__tile--now {
                  background: #0c4a6e; /* sky-900 */
                font-weight: bold;
                }
                .react-calendar__tile--active {
                  background: #2563eb; /* blue-600 */
                color: white;
                font-weight: bold;
                }
                .react-calendar__month-view__days__day--neighboringMonth {
                  color: #64748b; /* slate-500 */
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
              console.log("SELECTED DATE:", selectedDateString)
              return (
                <Link
                  from="/"
                  to="/floor/$floorId"
                  params={{ floorId: stat.id.toString() }}
                  search={{ date: selectedDateString }}
                  className={`block p-4 rounded-lg ${bgColor} text-white shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {/* The floor_name is now correctly mapped in the API layer */}
                    <h4 className="font-bold text-lg">{stat.floor_name}</h4>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-sm space-y-2 bg-white/10 rounded-md p-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Squares2X2Icon className="h-4 w-4" />
                        <span className="font-semibold">Total:</span>
                      </div>
                      <span className="font-bold">{stat.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4" />
                        <span className="font-semibold">Available:</span>
                      </div>
                      <span className="font-bold">{stat.available}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        <span className="font-semibold">Booked:</span>
                      </div>
                      <span className="font-bold">{stat.booked}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingCalendar