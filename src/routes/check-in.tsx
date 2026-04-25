import { createFileRoute, redirect } from '@tanstack/react-router'
import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { authService, useAuth } from '../auth'
import { checkInBooking } from '../api'

export const Route = createFileRoute('/check-in')({
  beforeLoad: async ({ context }) => {
    await context.auth.ensureLoaded()
    const auth = authService.getState()

    if (!auth.user || auth.user.role?.name !== 'admin') {
      throw redirect({ to: '/login' })
    }
  },
  component: CheckInPage,
})

const COOLDOWN_MS = 5_000 // Cooldown per QR code to prevent spam

function CheckInPage() {
  const { token } = useAuth()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScanMap = useRef<Map<string, number>>(new Map())
  const scanLockRef = useRef(false)
  const [booking, setBooking] = useState<any | null>(null)

  useEffect(() => {
    if (!token) return

    let isSubscribed = true
    // Create instance inside effect so it's tied to this render
    const scanner = new Html5Qrcode('reader')

    const startScanner = async () => {
      try {
        // SMALL DELAY: Give the previous 'stop()' a millisecond to breathe
        await new Promise((r) => setTimeout(r, 100))

        if (!isSubscribed) return

        // STAGING: Ensure the div is truly empty before the library touches it
        const container = document.getElementById('reader')
        if (container) container.innerHTML = ''

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            const now = Date.now()

            const lastTime = lastScanMap.current.get(decodedText)

            // Prevent scanning the same QR code within the cooldown period

            if (lastTime && now - lastTime < COOLDOWN_MS) return

            // prevent concurrent scans

            if (scanLockRef.current) return

            lastScanMap.current.set(decodedText, now)

            scanLockRef.current = true

            try {
              // Use the new API client function for the check-in
              const data = await checkInBooking(decodedText, token)

              setBooking(data) // Show the success modal

              toast.success('Checked in successfully!')
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : 'Check-in failed',
              )
            } finally {
              scanLockRef.current = false
            }
          },
        )
      } catch (err) {
        // If we get "WorkInProgressError", it confirms the race condition
        if (isSubscribed) console.warn('Scanner start skipped:', err)
      }
    }

    startScanner()

    return () => {
      isSubscribed = false
      // Most important: Use a synchronous check to stop if possible
      if (scanner.isScanning) {
        scanner
          .stop()
          .then(() => {
            scanner.clear()
          })
          .catch((err) => console.error('Failed to stop', err))
      }
    }
  }, [token])

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">QR Check-In</h1>
        <div id="reader" className="w-full overflow-hidden rounded-lg" />
      </div>

      {booking && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl p-8 text-center shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-green-500 mb-2">Welcome!</h2>

            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Check-in was successful.
            </p>

            <div className="space-y-2 text-lg">
              <div>
                👤 <span className="font-bold text-slate-300">User:</span>{' '}
                <span className="text-green-500 font-semibold">
                  {booking.user?.name} {booking.user?.surname}
                </span>
              </div>

              <div>
                🪑 <span className="font-bold text-slate-300">Desk:</span>{' '}
                <span className="text-blue-400 font-semibold">
                  {booking.desk?.id}
                </span>
              </div>

              <div>
                🏢 <span className="font-bold text-slate-300">Floor:</span>{' '}
                <span className="text-purple-400 font-semibold">
                  {booking.desk?.floor_entity?.floorName}
                </span>
              </div>
            </div>

            <button
              onClick={() => setBooking(null)}
              className="mt-6 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
