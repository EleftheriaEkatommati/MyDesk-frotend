import { createFileRoute, redirect } from '@tanstack/react-router'
import { authService } from '../auth'

export const Route = createFileRoute('/about')({
  beforeLoad: async ({ context, location }) => {
    await context.auth.ensureLoaded()

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
  component: About,
})

function About() {
  return <div>Hello from About!</div>
}
