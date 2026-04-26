import { useAuth } from '../auth'
import {
  bookDesk,
  createDesk,
  deleteBooking,
  deleteDesk,
  getAttendance,
  updateDesk,
  type DeskCreatePayload,
} from '../api'
import type { Booking, Desk, User } from '../api'
import { FLOOR_CONTAINER } from '../floorTheme'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

type Props = {
  desks: Desk[]
  setDesks: React.Dispatch<React.SetStateAction<Desk[]>>
  date: string
  floorId?: number
  userMap?: Map<number, User> | null
  myBooking?: Booking | null
}

export function FloorRenderer({
  desks,
  setDesks,
  date,
  floorId,
  userMap,
  myBooking,
}: Props) {
  const { user, token } = useAuth()
  const queryClient = useQueryClient()

  // Fetch attendance data to get booking statuses, which might not be reflected in desk.isBooked (e.g., for 'CHECKED_IN' status)
  const { data: attendance } = useQuery({
    queryKey: ['attendance', date, floorId],
    queryFn: () => getAttendance(token!, date, floorId),
    enabled: !!token && !!floorId,
  })

  const bookingStatusMap = useMemo(() => {
    const map = new Map<number, string>()
    if (attendance) {
      for (const booking of attendance) {
        if (booking.desk_id) {
          map.set(booking.desk_id, booking.status)
        }
      }
    }
    return map
  }, [attendance])

  const allBookingsForTable = useMemo(() => {
    // Use the `desks` prop as the source of truth for all bookings on the floor.
    const bookingsFromDesks = desks
      .filter((desk) => desk.isBooked && desk.bookingId && desk.bookedBy)
      .map(
        (desk): Booking => ({
          id: desk.bookingId!,
          desk_id: desk.id,
          user_id: desk.bookedBy!,
          booking_date: date,
          status: 'confirmed', // Default to 'confirmed'
          desk: desk,
        }),
      )

    // Create a map of statuses from the attendance data for quick lookups.
    const statusMap = new Map((attendance ?? []).map((b) => [b.id, b.status]))

    // Update the status for bookings that are in the attendance list (i.e., checked in).
    return bookingsFromDesks.map((b) => ({
      ...b,
      status: statusMap.get(b.id) ?? b.status,
    }))
  }, [desks, attendance, date])

  const role = user?.role?.name
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [didDrag, setDidDrag] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [draggingId, setDraggingId] = useState<number | null>(null)
  
  const [scale, setScale] = useState(1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) {
        const width = wrapperRef.current.clientWidth
        // We use Math.min so it doesn't scale *up* beyond 1x on large screens.
        setScale(Math.min(width / 800, 1))
      }
    }

    const observer = new ResizeObserver(updateScale)
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current)
    }
    
    // Also run on mount to ensure initial scale is correct
    updateScale()

    return () => observer.disconnect()
  }, [])

  const isAdmin = role === 'admin'
  const canBook = !!user
  const DESK_W = 64
  const DESK_H = 40

  const userHasActiveBooking =
    myBooking &&
    (myBooking.status === 'ACTIVE' || myBooking.status === 'CHECKED_IN')

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

    // If user clicks their own desk, do nothing but show info.
    if (desk.isBooked && desk.bookedBy === user.id) {
      toast.success('This is your current booking.')
      return
    }

    // If user has a booking and clicks another available desk.
    if (userHasActiveBooking) {
      const statusText =
        myBooking.status === 'CHECKED_IN' ? 'checked in to' : 'booked'
      toast.error(
        `You are already ${statusText} desk ${myBooking.desk_id} on this date. Please cancel your booking to book another desk.`,
      )
      return
    }

    const isBookedByOther = desk.isBooked && desk.bookedBy !== Number(user.id)
    if (isBookedByOther) return

    const prev = [...desks]

    // Optimistic update for immediate UI feedback
    setDesks((p) =>
      p.map((d) =>
        d.id === desk.id
          ? { ...d, isBooked: true, bookedBy: Number(user.id) }
          : d,
      ),
    )

    try {
      const newBooking = await bookDesk(desk.id, token, date)
      // Update desk with bookingId from response
      setDesks((p) =>
        p.map((d) =>
          d.id === desk.id ? { ...d, bookingId: newBooking.id } : d,
        ),
      )
      // Invalidate query to show the confirmation card without a page refresh
      await queryClient.invalidateQueries({ queryKey: ['myBooking', date] })
      toast.success(
        'Booking confirmed! A confirmation email with a QR code has been sent.',
      )
    } catch (err) {
      setDesks(prev)
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.'
      toast.error(`Booking failed: ${message}`)
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
    const scale = rect.width / 800

    const x = Math.round(((e.clientX - rect.left) / scale) / 20) * 20
    const y = Math.round(((e.clientY - rect.top) / scale) / 20) * 20

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
  const handleDelete = async (id: string) => {
    if (!isAdmin || !token) return

    const backup = desks
    setDesks((p) => p.filter((d) => d.id !== id))

    try {
      await deleteDesk(id, token)
    } catch {
      setDesks(backup)
    }
  }
  // ---------------- DELETE ----------------
  const handleDeleteBooking = async (bookingId: number) => {
    if (!token) return
    if (!confirm('Delete this booking?')) return

    const prev = [...desks]

    // optimistic update
    setDesks((p) =>
      p.map((d) =>
        d.bookingId === bookingId
          ? { ...d, isBooked: false, bookedBy: null, bookingId: undefined }
          : d,
      ),
    )

    try {
      await deleteBooking(bookingId, token)
      queryClient.invalidateQueries({
        queryKey: ['attendance', date, floorId],
      })
    } catch {
      setDesks(prev)
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
    const scale = rect.width / 800

    const rawX = (e.clientX - rect.left) / scale
    const rawY = (e.clientY - rect.top) / scale

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
      } catch (err) {
        console.error('Failed to update desk', err)
      }
    }

    setDraggingId(null)
    setDragStart(null)
  }

  // ================== RENDER ==================
  return (
    <>
      {userHasActiveBooking && (
        <div className="mb-4 p-4 text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 w-full max-w-2xl">
          <p className="font-semibold text-blue-800 dark:text-blue-200">
            You are already{' '}
            {myBooking.status === 'CHECKED_IN' ? 'checked in for' : 'booked on'}{' '}
            this date.
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            To book a different desk, you must first cancel your existing
            booking.
          </p>
        </div>
      )}

      {/* FLOOR WRAPPER */}
      <div 
        ref={wrapperRef} 
        className="w-full max-w-[800px] relative mx-auto" 
        style={{ height: 600 * scale }}
      >
        {/* FLOOR */}
        <div
          className={`${FLOOR_CONTAINER} absolute top-0 left-0 origin-top-left`}
          style={{ transform: `scale(${scale})` }}
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
          const bookingStatus = bookingStatusMap.get(desk.id)
          // A desk is considered booked if the API says so, or if its booking status is 'checked_in'.
          // This ensures checked-in desks still appear as booked.
          const isConsideredBooked =
            desk.isBooked || bookingStatus === 'CHECKED_IN'

          const isBookedByOther =
            isConsideredBooked && desk.bookedBy !== user?.id
          const isBookedByYou = isConsideredBooked && desk.bookedBy === user?.id
          const isDisabled =
            (isBookedByOther && canBook) ||
            (userHasActiveBooking && !isBookedByYou)

          const getDisabledTitle = () => {
            if (isBookedByOther) return 'This desk is already booked.'
            if (userHasActiveBooking && !isBookedByYou) {
              const statusText =
                myBooking.status === 'CHECKED_IN' ? 'checked in' : 'booked'
              return `You already have a ${statusText} desk for this date.`
            }
            if (isBookedByYou) return 'This is your booking.'
            return 'Book this desk'
          }

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
                  disabled={isDisabled}
                  title={getDisabledTitle()}
                  className={`flex flex-col items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                    isDisabled && !isBookedByYou
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
                          : isConsideredBooked
                            ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-300'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300'
                      }`}
                  >
                    {isBookedByYou
                      ? 'You'
                      : isConsideredBooked
                        ? 'Booked'
                        : desk.id}
                  </div>

                  {/* CHAIR */}
                  <div
                    className={`w-8 h-3 rounded-b-full mt-[2px]
                     ${
                       isBookedByYou
                         ? 'bg-sky-300 dark:bg-sky-700'
                         : isConsideredBooked
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
                    className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white shadow-md transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
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
                    className="absolute top-1/2 -right-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500 text-lg text-white shadow-md transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    ⟳
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
      </div> {/* END FLOOR WRAPPER */}

      {/* LEGEND */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
        {/* Available */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-emerald-100 dark:bg-emerald-900/50 border-2 border-emerald-300 dark:border-emerald-700 rounded-sm" />
            <div className="w-4 h-2 bg-emerald-200 dark:bg-emerald-800 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Available
          </span>
        </div>

        {/* Booked */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-rose-100 dark:bg-rose-900/50 border-2 border-rose-300 dark:border-rose-700 rounded-sm" />
            <div className="w-4 h-2 bg-rose-200 dark:bg-rose-800 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Booked
          </span>
        </div>

        {/* Yours */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-sky-100 dark:bg-sky-900/50 border-2 border-sky-300 dark:border-sky-700 rounded-sm" />
            <div className="w-4 h-2 bg-sky-200 dark:bg-sky-800 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Booked by you
          </span>
        </div>
      </div>
      {isAdmin && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Bookings</h2>

          <table className="min-w-full bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Booking ID</th>
                <th className="px-4 py-2 text-left">Desk</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {allBookingsForTable.map((b) => (
                <tr key={b.id} className="border-b">
                  <td className="px-4 py-2">{b.id}</td>
                  <td className="px-4 py-2">{b.desk_id}</td>
                  <td className="px-4 py-2 capitalize">
                    {b.status.toLowerCase().replace('_', ' ')}
                  </td>
                  <td className="px-4 py-2">
                    {userMap?.get(b.user_id)?.name ?? b.user_id}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDeleteBooking(b.id)}
                      className="text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
