import { useAuth } from '../auth'
import {
  bookDesk,
  updateDesk,
  deleteDesk,
  createDesk,
  type DeskCreatePayload,
} from '../api'
import type { Desk, User } from '../api'
import { FLOOR_CONTAINER } from '../floorTheme'
import { useState } from 'react'

type Mode = 'view' | 'book' | 'admin'

type Props = {
  desks: Desk[]
  setDesks: React.Dispatch<React.SetStateAction<Desk[]>>
  date: string
  floorId?: number
  userMap?: Map<number, User> | null
}

export function FloorRenderer({
  desks,
  setDesks,
  date,
  floorId,
  userMap,
}: Props) {
  const { user, token } = useAuth()
  const role = user?.role?.name
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [didDrag, setDidDrag] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const isAdmin = role === 'admin'
  const canBook = !!user
  const DESK_W = 64
  const DESK_H = 40

  // ---------------- COLLISION ----------------
  const isColliding = (id: number, x: number, y: number, desks: Desk[]) => {
    return desks.some((d) => {
      if (d.id === id) return false

      return (
        x < d.x + DESK_W &&
        x + DESK_W > d.x &&
        y < d.y + DESK_H &&
        y + DESK_H > d.y
      )
    })
  }
  // ---------------- BOOK ----------------
  const handleBook = async (desk: Desk) => {
    if (!canBook || !user || !token) return

    const isBookedByOther = desk.isBooked && desk.bookedBy !== Number(user.id)

    if (isBookedByOther) return

    const prev = [...desks]

    setDesks((p) =>
      p.map((d) =>
        d.id === desk.id
          ? { ...d, isBooked: true, bookedBy: Number(user.id) }
          : d,
      ),
    )

    try {
      await bookDesk(desk.id, token, date)
    } catch {
      setDesks(prev)
      alert('Booking failed')
    }
  }

  // ---------------- ADD ----------------
  const handleFloorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin || !floorId) return

    if (didDrag) {
      setDidDrag(false)
      return
    }

    const target = e.target as HTMLElement
    if (target.closest('.group')) return

    const rect = e.currentTarget.getBoundingClientRect()

    const x = Math.round((e.clientX - rect.left) / 20) * 20
    const y = Math.round((e.clientY - rect.top) / 20) * 20

    handleAddDesk(x, y)
  }

  const handleAddDesk = async (x: number, y: number) => {
    if (!isAdmin || !token || !floorId) return

    const deskPayload: DeskCreatePayload = {
      x,
      y,
      rotation: 0,
      floorId: floorId,
    }

    // Optimistic update with a temporary ID
    const tempId = -Date.now()
    const tempDesk: Desk = {
      ...deskPayload,
      id: tempId,
      isBooked: false,
      bookedBy: null,
    }
    setDesks((prev) => [...prev, tempDesk])

    try {
      const newDesk = await createDesk(deskPayload, token)
      // Replace temporary desk with the one from the backend
      setDesks((prev) => prev.map((d) => (d.id === tempId ? newDesk : d)))
    } catch (error) {
      console.error('Failed to create desk:', error)
      // Revert optimistic update on error
      setDesks((prev) => prev.filter((d) => d.id !== tempId))
    }
  }

  // ---------------- DELETE ----------------
  const handleDelete = async (id: number) => {
    if (!isAdmin || !token) return

    const backup = desks
    setDesks((p) => p.filter((d) => d.id !== id))

    try {
      await deleteDesk(id, token)
    } catch {
      setDesks(backup)
    }
  }

  // ---------------- ROTATE ----------------
  const handleRotate = async (desk: Desk) => {
    if (!isAdmin || !token) return

    const newRotation = (desk.rotation + 90) % 360
    const prev = desks

    setDesks((p) =>
      p.map((d) => (d.id === desk.id ? { ...d, rotation: newRotation } : d)),
    )

    try {
      await updateDesk(desk.id, { rotation: newRotation }, token)
    } catch {
      setDesks(prev)
    }
  }
  // ---------------- DRAG AND MOVE ----------------
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()

    const rawX = e.clientX - rect.left
    const rawY = e.clientY - rect.top

    const snappedX = snap(rawX)
    const snappedY = snap(rawY)

    // Hover preview
    if (isAdmin && !draggingId) {
      const target = e.target as HTMLElement

      if (target.closest('.group')) {
        setHoverCell(null)
      } else {
        setHoverCell({ x: snappedX, y: snappedY })
      }
    }

    // 🔥 DRAGGING FIX
    if (!isAdmin || !draggingId) return

    setDidDrag(true)

    setDesks((prev) =>
      prev.map((d) => (d.id === draggingId ? { ...d, x: rawX, y: rawY } : d)),
    )
  }
  const snap = (n: number) => Math.round(n / 20) * 20

  const handleMouseUp = async () => {
    if (!draggingId || !token) return

    const desk = desks.find((d) => d.id === draggingId)
    if (!desk) return

    const snappedX = snap(desk.x)
    const snappedY = snap(desk.y)

    if (isColliding(desk.id, snappedX, snappedY, desks)) {
      setDesks((p) =>
        p.map((d) =>
          d.id === draggingId ? { ...d, x: dragStart!.x, y: dragStart!.y } : d,
        ),
      )
    } else {
      setDesks((p) =>
        p.map((d) =>
          d.id === draggingId ? { ...d, x: snappedX, y: snappedY } : d,
        ),
      )

      try {
        await updateDesk(desk.id, { x: snappedX, y: snappedY }, token)
      } catch {}
    }

    setDraggingId(null)
    setDragPos(null)
    setDragStart(null)
  }

  // ================== RENDER ==================
  return (
    <>
      {/* FLOOR */}
      <div
        className={`${FLOOR_CONTAINER} relative`}
        onClick={handleFloorClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {isAdmin && hoverCell && (
          <div
            className="absolute pointer-events-none z-0"
            style={{
              left: hoverCell.x,
              top: hoverCell.y,
              width: 64,
              height: 40,
            }}
          >
            <div className="w-full h-full rounded-md border-2 border-dashed border-blue-400 bg-blue-100/40 dark:bg-blue-900/20" />
          </div>
        )}
        {desks.map((desk) => {
          const isBookedByOther = desk.isBooked && desk.bookedBy !== user?.id

          const isBookedByYou = desk.isBooked && desk.bookedBy === user?.id

          return (
            <div
              key={desk.id}
              className={`absolute group z-10 ${
                isAdmin ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
              style={{
                left: desk.x,
                top: desk.y,
              }}
              onMouseDown={(e) => {
                if (!isAdmin) return
                e.stopPropagation()
                setDraggingId(desk.id)
                setDragStart({ x: desk.x, y: desk.y })
              }}
            >
              {/* ROTATION WRAPPER (FIXED) */}
              <div
                style={{
                  transform: `rotate(${desk.rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              >
                <button
                  onClick={() => {
                    if (canBook) handleBook(desk)
                  }}
                  disabled={isBookedByOther && canBook}
                  className={`flex flex-col items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                    isBookedByOther
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                  }`}
                >
                  {/* TABLE */}
                  <div
                    className={`w-16 h-10 rounded-md shadow-md flex items-center justify-center text-xs font-bold border-2
                      ${
                        isBookedByYou
                          ? 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-300'
                          : desk.isBooked
                            ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-300'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300'
                      }`}
                  >
                    {isBookedByYou ? 'You' : desk.isBooked ? 'Booked' : desk.id}
                  </div>

                  {/* CHAIR */}
                  <div
                    className={`w-8 h-3 rounded-b-full mt-[2px]
                     ${
                       isBookedByYou
                         ? 'bg-sky-300 dark:bg-sky-700'
                         : desk.isBooked
                           ? 'bg-rose-300 dark:bg-rose-700'
                           : 'bg-emerald-300 dark:bg-emerald-700'
                     }`}
                  />
                </button>
              </div>

              {/* ADMIN CONTROLS */}
              {isAdmin && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(desk.id)
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Delete desk"
                    className="absolute -top-3 -right-3 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md text-sm"
                  >
                    ✕
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRotate(desk)
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Rotate desk"
                    className="absolute top-1/2 -right-10 -translate-y-1/2 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-md text-lg"
                  >
                    ⟳
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* LEGEND */}
      <div className="mt-8 flex gap-6 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
        {/* Available */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-emerald-100 border-2 border-emerald-400 rounded-sm" />
            <div className="w-4 h-2 bg-emerald-50 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Available
          </span>
        </div>

        {/* Booked */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-red-200 border-2 border-red-400 rounded-sm" />
            <div className="w-4 h-2 bg-red-400 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Booked
          </span>
        </div>

        {/* Yours */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-blue-200 border-2 border-blue-400 rounded-sm" />
            <div className="w-4 h-2 bg-blue-400 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Booked by you
          </span>
        </div>
      </div>
    </>
  )
}
