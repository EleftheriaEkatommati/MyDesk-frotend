import { createFileRoute, redirect } from '@tanstack/react-router'
import { authService } from '../auth'

export const Route = createFileRoute('/settings')({
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
  component: Settings,
})

function Settings() {
  return (
    <div className="p-2">
      <h2 className="text-2xl font-bold">Settings</h2>
    </div>
  )
}
