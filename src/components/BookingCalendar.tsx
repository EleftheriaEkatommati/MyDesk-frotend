import React, { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useQuery } from '@tanstack/react-query'
import { getDesks, getFloors } from '../api'

const BookingCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const { data: floors, isLoading: floorsLoading } = useQuery({
    queryKey: ['floors'],
    queryFn: getFloors,
  })

  const {
    data: desks,
    isLoading: desksLoading,
    error,
  } = useQuery({
    queryKey: ['desks'],
    queryFn: getDesks,
  })

  if (floorsLoading || desksLoading) return <div>Loading...</div>
  if (error) return <div>Error loading data</div>

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
          />
          <p className="mt-2">Selected date: {selectedDate.toDateString()}</p>
          {/* Note: Historical data per date not available in current API */}
        </div>

        <div>
          <h3 className="text-xl mb-2">Floor Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {floorStats?.map((stat) => {
              let bgColor = 'bg-green-500'
              if (stat.booked === stat.total) bgColor = 'bg-red-800'
              else if (stat.booked >= stat.total / 2) bgColor = 'bg-orange-500'
              return (
                <div
                  key={stat.id}
                  className={`p-4 rounded ${bgColor} text-white`}
                >
                  <h4 className="font-bold">{stat.floorName}</h4>
                  <p>Total Desks: {stat.total}</p>
                  <p>Available: {stat.available}</p>
                  <p>Booked: {stat.booked}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingCalendar
