import { createFileRoute, redirect } from '@tanstack/react-router'
import BookingCalendar from '../components/BookingCalendar'
import { authService } from '../auth'

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
  return (
    <div>
      <h3>Welcome Home!</h3>
      <BookingCalendar />
    </div>
  )
}
