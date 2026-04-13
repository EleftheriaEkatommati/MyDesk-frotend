import { createFileRoute, redirect } from '@tanstack/react-router'
import BookingCalendar from '../components/BookingCalendar'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
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
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <BookingCalendar />
    </div>
  )
}
