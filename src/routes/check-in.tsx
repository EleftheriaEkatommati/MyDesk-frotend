import { createFileRoute, redirect } from '@tanstack/react-router'
import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth, authService } from '../auth'

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

const COOLDOWN_MS = 10_000

function CheckInPage() {
  const { token } = useAuth()

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isRunningRef = useRef(false)

  const lastScanMap = useRef<Map<string, number>>(new Map())
  const scanLockRef = useRef(false)

  const [booking, setBooking] = useState<any | null>(null)

  useEffect(() => {
    if (!token) return

    const scanner = new Html5Qrcode('reader')
    scannerRef.current = scanner

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            const now = Date.now()
            const lastTime = lastScanMap.current.get(decodedText)

            //prevent same QR spam
            if (lastTime && now - lastTime < COOLDOWN_MS) return

            // prevent concurrent scans
            if (scanLockRef.current) return

            lastScanMap.current.set(decodedText, now)
            scanLockRef.current = true

            try {
              const res = await fetch(
                'http://localhost:8000/api/v1/bookings/check-in',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ qr_data: decodedText }),
                }
              )

              if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail || 'Check-in failed')
              }

              const data = await res.json()

              setBooking(data)

              toast.success('Checked in successfully')

              // auto close welcome modal after 5s
              setTimeout(() => setBooking(null), 5000)
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : 'Check-in failed'
              )
            } finally {
              scanLockRef.current = false
            }
          }
        )

        isRunningRef.current = true
      } catch (err) {
        console.error('Failed to start scanner:', err)
      }
    }

    startScanner()

    return () => {
      const scannerInstance = scannerRef.current

      if (scannerInstance && isRunningRef.current) {
        isRunningRef.current = false
        scannerInstance.stop().catch(() => {})
      }
    }
  }, [token])

  return (
    <div className="p-6 relative">
      <h1 className="text-xl font-bold mb-4">QR Check-In</h1>

      <div id="reader" className="max-w-md mx-auto" />

      {booking && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Welcome!
            </h2>

            <p className="text-gray-600 mb-6">
              Your check-in was successful.
            </p>

            <div className="space-y-2 text-lg">
              <div>
                👤 <span className="font-bold">User:</span>{' '}
                <span className="text-green-600 font-semibold">
                  {booking.user?.name} {booking.user?.surname}
                </span>
              </div>

              <div>
                🪑 <span className="font-bold">Desk:</span>{' '}
                <span className="text-blue-600 font-semibold">
                  {booking.desk?.id}
                </span>
              </div>

              <div>
                🏢 <span className="font-bold">Floor:</span>{' '}
                <span className="text-purple-600 font-semibold">
                  {booking.desk?.floor_entity?.name}
                </span>
              </div>
            </div>

            <button
              onClick={() => setBooking(null)}
              className="mt-6 px-4 py-2 bg-black text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}