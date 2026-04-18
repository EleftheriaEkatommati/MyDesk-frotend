import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  getDesksByFloor,
  getFloor,
  getUsers,
  NotFoundError,
  type Desk,
  type User,
} from '../../api'
import { useEffect, useMemo, useState } from 'react'
import { FloorRenderer } from '../../components/FloorRenderer'

function getLocalDateString() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

type FloorSearch = {
  date?: string
}

export const Route = createFileRoute('/floor/$floorId')({
  validateSearch: (search: Record<string, unknown>): FloorSearch => ({
    date:
      typeof search.date === 'string' && search.date.trim()
        ? search.date
        : getLocalDateString(),
  }),

  loader: async ({ params, location, context }) => {
    const { auth } = context
    const floorId = Number(params.floorId)
    const search = location.search as FloorSearch | undefined
    const date = search?.date ?? getLocalDateString()

    try {
      const [floor, floorDesks] = await Promise.all([
        getFloor(floorId),
        getDesksByFloor(floorId, date),
      ])

      let users: User[] | null = null

      if (auth.user?.role?.name === 'admin' && auth.token) {
        users = await getUsers(auth.token)
      }

      return { floor, floorDesks, users, date }
    } catch (e) {
      if (e instanceof NotFoundError) throw notFound()
      throw e
    }
  },

  component: FloorDetail,
})

function FloorDetail() {
  const { floor, floorDesks, users, date } = Route.useLoaderData()
  const { auth } = Route.useRouteContext()

  const isAdmin = auth.user?.role?.name === 'admin'

  const [desks, setDesks] = useState<Desk[]>(floorDesks)

  useEffect(() => {
    setDesks(floorDesks)
  }, [floorDesks])

  const userMap = useMemo(() => {
    if (!users) return null
    return new Map(users.map((u) => [u.id, u]))
  }, [users])

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        {floor.floor_name}
      </h2>

      <FloorRenderer
          desks={desks}
          setDesks={setDesks}
          date={date}
          floorId={floor.id}
          userMap={userMap}
        />
    </div>
  )
}