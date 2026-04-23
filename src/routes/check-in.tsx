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

const COOLDOWN_MS = 5_000 // Cooldown per QR code to prevent spam

function CheckInPage() {
  const { token } = useAuth()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScanMap = useRef<Map<string, number>>(new Map())
  const scanLockRef = useRef(false)
  const [booking, setBooking] = useState<any | null>(null)

  useEffect(() => {
    if (!token) return

    // Initialize scanner only once
    const scanner = new Html5Qrcode('reader')
    scannerRef.current = scanner

    const startScanner = async () => {
      try {
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
              const res = await fetch(
                'http://localhost:8000/api/v1/bookings/check-in',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ qr_data: decodedText }),
                },
              )

              if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || 'Check-in failed')
              }

              const data = await res.json()
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
        console.error('Failed to start scanner:', err)
        toast.error(
          'Could not start QR scanner. Please check camera permissions.',
        )
      }
    }

    startScanner()

    return () => {
      const scannerInstance = scannerRef.current
      if (scannerInstance && scannerInstance.isScanning) {
        scannerInstance.stop().catch(console.error)
      }
    }
  }, [token])

  return (
    <div className="p-6 relative">
      <h1 className="text-xl font-bold mb-4">QR Check-In</h1>
      <div id="reader" className="max-w-md mx-auto" />

      {booking && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 text-white rounded-xl p-8 text-center shadow-xl max-w-md w-full border border-slate-700">
            <h2 className="text-2xl font-bold text-green-500 mb-2">Welcome!</h2>

            <p className="text-slate-400 mb-6">Check-in was successful.</p>

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
                  {booking.desk?.floor_entity?.name}
                </span>
              </div>
            </div>

            <button
              onClick={() => setBooking(null)}
              className="mt-6 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
