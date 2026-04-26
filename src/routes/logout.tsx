import { createFileRoute, Link } from '@tanstack/react-router'
import { ComputerDesktopIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/logout')({
  component: Logout,
})

function Logout() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-md p-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ComputerDesktopIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">
              MyDesk
            </h1>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          You have been successfully logged out. Have a great day!
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-3 font-bold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Log in again
        </Link>
      </div>
    </div>
  )
}
