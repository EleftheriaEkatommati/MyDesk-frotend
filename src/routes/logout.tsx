import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/logout')({
  component: Logout,
})

function Logout() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
          Logged Out
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          You have been successfully logged out of your account. Have a great
          day!
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Log in again
        </Link>
      </div>
    </div>
  )
}
