// src/routes/admin/check-in.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Html5Qrcode } from 'html5-qrcode'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { redirect } from '@tanstack/react-router'
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

  useEffect(() => {
    const scanner = new Html5Qrcode('reader')

    scanner
      .start(
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
              throw new Error(err.detail)
            }

            const booking = await res.json()
            toast.success(`Checked in: Desk ${booking.desk_id}`)

            await scanner.stop()
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : 'Check-in failed'
            )
          }
        }
      )
      .catch(console.error)

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [token])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">QR Check-In</h1>
      <div id="reader" className="max-w-md mx-auto" />
    </div>
  )
}