import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../auth'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import { Bars3Icon } from '@heroicons/react/24/solid'

interface MyRouterContext {
  auth: ReturnType<typeof useAuth>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-900">
      {user && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}
      <div className="flex flex-1 flex-col min-w-0">
        {user && (
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80 lg:hidden">
            <span className="font-bold text-lg text-slate-800 dark:text-white">
              MyDesk
            </span>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </header>
        )}
        <main className="flex-1 flex flex-col text-black dark:text-white">
          <div className="w-full p-4 sm:p-6 md:p-8 flex-1 flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster position="bottom-center" />
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}
