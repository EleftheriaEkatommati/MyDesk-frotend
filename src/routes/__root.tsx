import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Sidebar } from '../components/Sidebar'

export const Route = createRootRoute({
  component: () => (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 text-black dark:text-white">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  ),
})
