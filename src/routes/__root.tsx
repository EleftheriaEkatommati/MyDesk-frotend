import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../auth'

interface MyRouterContext {
  auth: ReturnType<typeof useAuth>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      {user && <Sidebar />}
      <main className="flex-1 p-8 text-black dark:text-white">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}
