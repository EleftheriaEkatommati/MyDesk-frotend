import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/register')({
  component: Register,
})

function Register() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8">
          Create an Account
        </h2>
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Create a password"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/50 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </form>
        <p className="mt-6 text-sm text-center text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-500 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
