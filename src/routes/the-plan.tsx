import { createFileRoute, redirect, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

import { bookDesk, getDesksByFloor, type Desk } from '../api'
import { authService, useAuth } from '../auth'

export const Route = createFileRoute('/the-plan')({
  component: ThePlan,
  beforeLoad: async ({ context, location }) => {
    await context.auth.ensureLoaded()
    if (!authService.getState().user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
        replace: true,
      })
    }
  },
})

function ThePlan() {
  const { floorId } = useParams({ strict: false }) as { floorId: string }

  const [desks, setDesks] = useState<Desk[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const { user, token } = useAuth()

  const formattedDate = selectedDate.toLocaleDateString('en-CA')

  useEffect(() => {
    getDesksByFloor(Number(floorId), formattedDate)
      .then(setDesks)
      .catch(() => setError('Failed to load desks'))
  }, [floorId, formattedDate])

  const handleBook = async (desk: Desk) => {
    if (!user || !token) return

    const originalDesks = [...desks]

    // optimistic update
    setDesks((prev) =>
      prev.map((d) =>
        d.id === desk.id
          ? {
              ...d,
              isBooked: true,
              bookedBy: Number(user.id),
            }
          : d,
      ),
    )

    try {
      await bookDesk(desk.id, user.id, token, formattedDate)
    } catch (err) {
      setDesks(originalDesks)
      setError((err as Error).message)
      setTimeout(() => setError(null), 3000)
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-extrabold mb-4">Floor {floorId}</h1>

      {/* 📅 CALENDAR */}
      <div className="mb-6">
        <Calendar
          onChange={(value) => setSelectedDate(value as Date)}
          value={selectedDate}
        />
        <p className="mt-2 font-medium">Selected date: {formattedDate}</p>
      </div>

      {/* Blueprint */}
      <div className="relative w-[800px] h-[600px] border rounded-lg overflow-hidden">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded">
            {error}
          </div>
        )}

        {desks.map((desk) => {
          const isBookedByOther = desk.isBooked && desk.bookedBy !== user?.id
          const isBookedByYou = desk.isBooked && desk.bookedBy === user?.id

          return (
            <div
              key={desk.id}
              className="absolute"
              style={{
                left: desk.x,
                top: desk.y,
                transform: `rotate(${desk.rotation}deg)`,
              }}
            >
              <button
                onClick={() => handleBook(desk)}
                disabled={isBookedByOther}
                className={`p-2 rounded ${
                  isBookedByYou
                    ? 'bg-blue-500'
                    : desk.isBooked
                      ? 'bg-red-500'
                      : 'bg-green-500'
                } text-white`}
              >
                {isBookedByYou ? 'You' : desk.isBooked ? 'Booked' : desk.id}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ThePlan
