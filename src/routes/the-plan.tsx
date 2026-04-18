import { createFileRoute, redirect, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { FloorRenderer } from "../components/FloorRenderer"
import { bookDesk, getDesksByFloor, type Desk } from '../api'
import { useAuth } from '../auth'

export const Route = createFileRoute('/the-plan')({
  component: ThePlan,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
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
      <FloorRenderer
        mode="book"
        desks={desks}
        setDesks={setDesks}
        date={formattedDate}
        floorId={Number(floorId)}
      />
      </div>
  )
}

export default ThePlan
