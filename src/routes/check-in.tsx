import { createFileRoute, redirect } from '@tanstack/react-router'
import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef } from 'react'
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

function CheckInPage() {
  const { token } = useAuth()

  // keep scanner instance stable across renders
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isRunningRef = useRef(false)

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

              const booking = await res.json()
              toast.success(`Checked in: Desk ${booking.desk_id}`)

              if (isRunningRef.current) {
                isRunningRef.current = false
                await scanner.stop()
              }
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : 'Check-in failed'
              )
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
      const currentScanner = scannerRef.current

      if (currentScanner && isRunningRef.current) {
        isRunningRef.current = false

        currentScanner
          .stop()
          .catch(() => {

          })
      }
    }
  }, [token])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">QR Check-In</h1>
      <div id="reader" className="max-w-md mx-auto" />
    </div>
  )
}