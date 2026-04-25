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

const getToday = () => new Date()
const today = getToday()

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const BookingCalendar: React.FC = () => {
  const { user, token } = useAuth()
  const [activeStartDate, setActiveStartDate] = useState<Date>(getToday())
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

  const { data: monthlyAvailability } = useQuery({
    queryKey: [
      'monthlyAvailability',
      formatDate(activeStartDate).substring(0, 7),
    ],
    queryFn: async () => {
      if (!floors) return new Map<string, boolean>()
      const year = activeStartDate.getFullYear()
      const month = activeStartDate.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const availabilityMap = new Map<string, boolean>()
      const dayChecks = Array.from({ length: daysInMonth }, (_, i) => i + 1)

      const results = await Promise.allSettled(
        dayChecks.map(async (day) => {
          const currentDate = new Date(year, month, day)
          const dateString = formatDate(currentDate)
          const desksByFloor = await Promise.all(
            floors.map((floor) => getDesksByFloor(floor.id, dateString)),
          )
          let totalDesks = 0
          let bookedDesks = 0
          for (const floorDesks of desksByFloor) {
            totalDesks += floorDesks.length
            bookedDesks += floorDesks.filter((d) => d.isBooked).length
          }
          return { dateString, hasAvailability: totalDesks > bookedDesks }
        }),
      )

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.hasAvailability) {
          availabilityMap.set(result.value.dateString, true)
        }
      })
      return availabilityMap
    },
    enabled: !!floors,
  })

  const floorDeskQueries = useQueries({
    queries: (floors ?? []).map((floor) => ({
      queryKey: ['desksByFloor', floor.id, selectedDateString],
      queryFn: () => getDesksByFloor(floor.id, selectedDateString),
      enabled: !!floors,
    })),
  })

  const desksLoading =
    floorsLoading || floorDeskQueries.some((q) => q.isLoading)
  const queryError = floorDeskQueries.find((q) => q.error)?.error

  if (desksLoading)
    return (
      <div className="p-8 text-center font-medium">Loading Dashboard...</div>
    )
  if (queryError)
    return (
      <div className="p-4 text-red-500 text-center">Error loading data.</div>
    )
  if (!floors)
    return <div className="p-4 text-red-500 text-center">No floor data.</div>

  const floorStats = floors.map((floor, index) => {
    const queryResult = floorDeskQueries[index]
    const floorDesks =
      queryResult?.isSuccess && queryResult.data ? queryResult.data : []
    const total = floorDesks.length
    const booked = floorDesks.filter((d) => d.isBooked).length
    const available = total - booked
    return { ...floor, total, booked, available }
  })

  const totalDesks = floorStats.reduce((sum, stat) => sum + stat.total, 0)
  const bookedDesks = floorStats.reduce((sum, stat) => sum + stat.booked, 0)
  const availableDesks = totalDesks - bookedDesks

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && monthlyAvailability?.get(formatDate(date))) {
      return (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400" />
        </div>
      )
    }
    return null
  }

  const handleDeleteFloor = async (floorId: number) => {
    if (!token || !isAdmin) return
    if (
      !window.confirm(
        'Are you sure? This will delete all desks and bookings on this floor.',
      )
    )
      return
    try {
      await deleteFloor(floorId, token)
      toast.success('Floor deleted')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
    } catch (err) {
      toast.error('Failed to delete floor')
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {isAdmin && <CreateFloorForm />}
      {myBooking && <BookingConfirmationCard booking={myBooking} />}

      {/* --- Stats Row --- */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icon={Squares2X2Icon}
          label="Total Desks"
          value={totalDesks}
          color="text-slate-400"
        />
        <StatCard
          icon={UserGroupIcon}
          label="Booked Desks"
          value={bookedDesks}
          color="text-slate-400"
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Available Desks"
          value={availableDesks}
          color="text-green-500"
        />
      </div>

      {/* --- Main Dashboard Grid --- */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Calendar (Sticky on Desktop) */}
        <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold mb-6 text-slate-800 dark:text-slate-200">
              Select a Date
            </h3>
            <style>{`
              .react-calendar { width: 100%; border: none; font-family: inherit; background: transparent; }
              
              /* Fix Navigation Button Colors (Back/Forward) */
              .react-calendar__navigation button { 
                min-width: 44px; 
                background: none; 
                font-weight: 600; 
                border-radius: 0.5rem; 
                color: #475569 !important; /* Slate 600 for light mode visibility */
                font-size: 1.25rem;
              }
              
              .react-calendar__navigation button:enabled:hover { background-color: rgba(0,0,0,0.05); }
              .react-calendar__navigation button:disabled { color: #cbd5e1 !important; }

              .react-calendar__tile { 
                position: relative; height: 48px; display: flex; align-items: center; justify-content: center; 
                border-radius: 0.75rem; font-weight: 500; transition: all 0.2s; background: transparent !important; color: #334155; 
              }

              .react-calendar__tile--active { background: #4f46e5 !important; color: white !important; font-weight: bold; }
              .react-calendar__tile:enabled:hover { background-color: #f1f5f9 !important; }
              
              /* Disabled/Neighbor dates */
              .react-calendar__tile:disabled { color: #cbd5e1 !important; cursor: not-allowed; }
              .react-calendar__month-view__days__day--neighboringMonth { color: #e2e8f0 !important; }
              .react-calendar__tile--now { color: #4f46e5; font-weight: 800; text-decoration: underline; }
              
              /* Dark Mode Overrides */
              @media (prefers-color-scheme: dark) {
                .react-calendar__navigation button { color: #f8fafc !important; } /* White arrows in dark mode */
                .react-calendar__navigation button:enabled:hover { background-color: rgba(255,255,255,0.1); }
                .react-calendar__tile { color: #cbd5e1; }
                .react-calendar__tile:enabled:hover { background-color: #334155 !important; }
                .react-calendar__tile:disabled { color: #475569 !important; }
                .react-calendar__month-view__days__day--neighboringMonth { color: #334155 !important; }
                .react-calendar__tile--now { color: #818cf8; }
              }
            `}</style>
            <Calendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              minDate={today}
              onActiveStartDateChange={({ activeStartDate }) =>
                activeStartDate && setActiveStartDate(activeStartDate)
              }
              activeStartDate={activeStartDate}
              tileContent={tileContent}
            />
            <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center text-sm font-medium border border-indigo-100 dark:border-indigo-900/30">
              <span className="text-slate-500 dark:text-slate-400">
                Viewing:
              </span>{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {selectedDate.toDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="xl:col-span-7 space-y-8">
          <section>
            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
              Floor Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {floorStats.map((stat) => {
                let statusColor = 'bg-green-500'
                let Icon = CheckCircleIcon
                if (stat.total > 0 && stat.booked === stat.total) {
                  statusColor = 'bg-red-600'
                  Icon = XCircleIcon
                } else if (stat.total > 0 && stat.booked >= stat.total / 2) {
                  statusColor = 'bg-amber-500'
                  Icon = ExclamationTriangleIcon
                }

                return (
                  <div key={stat.id} className="relative group">
                    <Link
                      to="/floor/$floorId"
                      params={{ floorId: stat.id.toString() }}
                      search={{ date: selectedDateString }}
                      className={`block p-5 rounded-xl ${statusColor} text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg">{stat.floor_name}</h4>
                        <Icon className="h-6 w-6 opacity-80" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wider bg-black/20 rounded-lg p-2 backdrop-blur-sm">
                        <div>
                          <p className="opacity-70 text-[9px]">Total</p>
                          <p className="text-sm font-bold">{stat.total}</p>
                        </div>
                        <div>
                          <p className="opacity-70 text-[9px]">Free</p>
                          <p className="text-sm font-bold">{stat.available}</p>
                        </div>
                        <div>
                          <p className="opacity-70 text-[9px]">Used</p>
                          <p className="text-sm font-bold">{stat.booked}</p>
                        </div>
                      </div>
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleDeleteFloor(stat.id)
                        }}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 text-red-500 p-1.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
              Who's In Today
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              {!attendance || attendance.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                  <UserIcon className="h-10 w-10 opacity-20" />
                  <p>No one checked in for this date.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {attendance.map((b) => (
                    <li
                      key={b.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 uppercase shadow-inner">
                          {b.user?.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold dark:text-white">
                            {b.user?.name} {b.user?.surname}
                          </p>
                          <p className="text-xs text-slate-500">
                            {b.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-200">
                          {b.desk?.floor?.floor_name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Desk {b.desk?.id}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center transition-transform hover:-translate-y-1">
    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg mr-4">
      <Icon className={`h-6 w-6 ${color}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  </div>
)

function CreateFloorForm() {
  const [floorNumber, setFloorNumber] = useState('')
  const [floorName, setFloorName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !floorNumber) return
    setIsCreating(true)
    try {
      await createFloor(
        { floorNumber: Number(floorNumber), floorName: floorName || undefined },
        token,
      )
      toast.success('Floor added')
      setFloorNumber('')
      setFloorName('')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
    } catch (err) {
      toast.error('Error creating floor')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/20 shadow-sm">
      <h3 className="text-lg font-bold mb-4 text-indigo-900 dark:text-indigo-100">
        Floor Management
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="flex-none w-full md:w-32">
          <input
            type="number"
            placeholder="Floor #"
            value={floorNumber}
            required
            onChange={(e) => setFloorNumber(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="Floor Name (Optional)"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button
          disabled={isCreating}
          className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md"
        >
          {isCreating ? 'Adding...' : 'Add Floor'}
        </button>
      </form>
    </div>
  )
}

export default BookingCalendar
