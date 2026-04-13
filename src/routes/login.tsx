import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../auth'

type LoginSearch = {
  redirect?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirect: search.redirect as string | undefined,
    }
  },
  component: Login,
})

function Login() {
  // Using fake login data as default values
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')

  const search = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Accept any non-empty fake credentials to make testing easier
    if (email.trim() !== '' && password.trim() !== '') {
      try {
        // Call your actual login API with the string credentials
        await login(email, password)
        // Invalidate the router to ensure all loaders are re-run with the new auth context
        await router.invalidate()

        if (search.redirect) {
          router.history.push(search.redirect)
        } else {
          navigate({ to: '/' })
        }
      } catch (err: any) {
        setError(err.message || 'Invalid username or password')
      }
    } else {
      setError('Please enter both email and password')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8">
          Welcome Back
        </h2>
        {error && (
          <div className="mb-4 p-3 text-sm text-red-500 bg-red-100/50 rounded-lg text-center">
            {error}
          </div>
        )}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter your password"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/50 transition-colors"
            >
              Sign In
            </button>
          </div>
        </form>
        <p className="mt-6 text-sm text-center text-slate-600 dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-blue-500 font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
