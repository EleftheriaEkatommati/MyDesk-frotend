import React, { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  Squares2X2Icon,
  CheckIcon,
  UserIcon,
} from '@heroicons/react/24/solid'
import { getDesks, getFloors } from '../api'
  const getTomorrow = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
  }
  const tomorrow = getTomorrow()
  const BookingCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(getTomorrow())

  const { data: floors, isLoading: floorsLoading } = useQuery({
    queryKey: ['floors'],
    queryFn: getFloors,
  })

  const selectedDateString = selectedDate.toLocaleDateString('en-CA')

  const {
    data: desks,
    isLoading: desksLoading,
    error,
  } = useQuery({
    queryKey: ['desks', selectedDateString],
    queryFn: () => getDesks(selectedDateString),
  })

  if (floorsLoading || desksLoading) return <div className="p-4">Loading...</div>
  if (error) {
    console.error('Desks query error:', error)
    return <div className="p-4 text-red-500">Error loading desks: {String(error)}</div>
  }
  if (!desks) return <div className="p-4 text-red-500">No desks data</div>
  if (!floors) return <div className="p-4 text-red-500">No floors data</div>

  const totalDesks = desks?.length || 0
  const bookedDesks = desks?.filter((d) => d.isBooked).length || 0
  const occupancyRate = totalDesks > 0 ? (bookedDesks / totalDesks) * 100 : 0

  const floorStats = floors?.map((floor) => {
    const floorDesks = desks?.filter((d) => d.floorId === floor.id) || []
    const total = floorDesks.length
    const booked = floorDesks.filter((d) => d.isBooked).length
    const available = total - booked
    return { ...floor, total, booked, available }
  })

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Availability and Booking Calendar
      </h2>

      {/* <div className="mb-4">
        <label
          htmlFor="floor-select"
          className="block text-sm font-medium mb-2"
        >
          Select Floor:
        </label>
        <select
          id="floor-select"
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">All Floors</option>
          {floors?.map((floor) => (
            <option key={floor.id} value={floor.floorName}>
              {floor.floorName}
            </option>
          ))}
        </select>
      </div> */}

      <div className="mb-4">
        <p>Total Desks: {totalDesks}</p>
        <p>Booked Desks: {bookedDesks}</p>
        <p>Occupancy Rate: {occupancyRate.toFixed(2)}%</p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-xl mb-2">Monthly Calendar</h3>
          <style>
            {`
              .react-calendar {
                background-color: #000;
                color: #fff;
                border: 1px solid #333;
                width: 100%;
              }
              .react-calendar__tile {
                background-color: #000;
                color: #fff;
              }
              .react-calendar__tile:hover {
                background-color: #333;
              }
              .react-calendar__tile--active {
                background-color: #555;
              }
              .react-calendar__navigation button {
                background-color: #000;
                color: #fff;
              }
              .react-calendar__month-view__weekdays {
                background-color: #111;
              }
            `}
          </style>
          <Calendar
            onChange={(value) => setSelectedDate(value as Date)}
            value={selectedDate}
            minDate={tomorrow}
          />
          <p className="mt-2">Selected date: {selectedDate.toDateString()}</p>
          {/* Note: Historical data per date not available in current API */}
        </div>

        <div>
          <h3 className="text-xl mb-2">Floor Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {floorStats?.map((stat) => {
              let bgColor = 'bg-green-500'
              let Icon = CheckCircleIcon
              if (stat.booked === stat.total) {
                bgColor = 'bg-red-800'
                Icon = XCircleIcon
              } else if (stat.booked >= stat.total / 2) {
                bgColor = 'bg-orange-500'
                Icon = ExclamationTriangleIcon
              }
              return (
                <Link
                  to="/floor/$floorId"
                  params={{ floorId: stat.id.toString() }}
                  search={{ date: selectedDateString }}
                  className={`block p-4 rounded-lg ${bgColor} text-white shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg">{stat.floorName}</h4>
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
