// floorTheme.ts

import type { Desk } from "../api"

/**
 * Floor container styling (shared base)
 * This is the "ThePlan" visual identity
 */
export const FLOOR_CLASS =
  "relative w-[800px] h-[600px] border rounded-lg overflow-hidden bg-slate-100"

/**
 * Grid texture overlay (ThePlan signature look)
 */
export const FLOOR_GRID =
  "bg-[linear-gradient(to_right,#ccc_1px,transparent_1px),linear-gradient(to_bottom,#ccc_1px,transparent_1px)] bg-[size:20px_20px]"

/**
 * Full floor container class (recommended to use everywhere)
 */
export const FLOOR_CONTAINER =
  "relative w-[800px] h-[600px] " +
  "bg-slate-50 dark:bg-slate-900 " +
  "border-4 border-slate-800 dark:border-slate-400 " +
  "rounded-lg shadow-2xl overflow-hidden " +
  "bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] " +
  "dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] " +
  "bg-[size:20px_20px]";

/**
 * Base desk styling (shape + typography + feel)
 */
export const DESK_BASE =
  "w-16 h-10 rounded text-white text-xs flex items-center justify-center shadow transition select-none"

/**
 * Admin desk styling (optional enhancement)
 */
export const DESK_ADMIN =
  "cursor-move hover:scale-[1.02] active:scale-[0.98]"

/**
 * Booking color logic (single source of truth)
 */
export function getDeskColor(desk: Desk, userId?: number) {
  const isBookedByOther = desk.isBooked && desk.bookedBy !== userId
  const isBookedByYou = desk.isBooked && desk.bookedBy === userId

  if (isBookedByYou) return "bg-blue-500"
  if (isBookedByOther) return "bg-red-500"
  return "bg-green-500"
}

/**
 * Optional: floor status color (used in BookingCalendar)
 */
export function getFloorStatusColor(
  total: number,
  booked: number
) {
  if (total === 0) return "bg-slate-400"
  if (booked === 0) return "bg-green-500"
  if (booked === total) return "bg-red-600"
  if (booked >= total / 2) return "bg-orange-500"
  return "bg-green-400"
}

/**
 * Optional: occupancy percentage helper
 */
export function getOccupancyRate(total: number, booked: number) {
  if (total === 0) return 0
  return (booked / total) * 100
}

/**
 * Combines desk base styles properly
 */
export function getDeskClass(
  desk: Desk,
  userId?: number,
  extra?: string
) {
  return `${DESK_BASE} ${getDeskColor(desk, userId)} ${extra ?? ""}`
}