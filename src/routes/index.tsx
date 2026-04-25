import { createFileRoute, redirect } from '@tanstack/react-router'
import BookingCalendar from '../components/BookingCalendar'
import { authService, useAuth } from '../auth'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context, location }) => {
    // Wait for the initial auth load to complete
    await context.auth.ensureLoaded()

    // Now, check the auth state directly from the singleton service
    if (!authService.getState().user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
        replace: true,
      })
    }
  },
  component: Index,
})

function Index() {
  const { user } = useAuth()
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Here's what's happening in your office today.
        </p>
      </div>
      <BookingCalendar />
    </div>
  )
}
