import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
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
  component: About,
})

function About() {
  return <div className="p-2">Hello from About!</div>
}
