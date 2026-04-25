import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../auth'

// Define the search params that this route can accept.
type AuthCallbackSearch = {
  token?: string
  error?: string
  redirect?: string
}

export const Route = createFileRoute('/auth/callback')({
  // Validate and parse the search params. This is type-safe.
  validateSearch: (search: Record<string, unknown>): AuthCallbackSearch => {
    return {
      token: search.token as string | undefined,
      error: search.error as string | undefined,
      redirect: search.redirect as string | undefined,
    }
  },
  component: AuthCallback,
})

function AuthCallback() {
  const { token, error, redirect } = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const { reloadUser } = useAuth()

  useEffect(() => {
    const handleAuth = async () => {
      if (token) {
        // 1. Store the token from the URL.
        localStorage.setItem('token', token)

        // 2. Reload user data using the new token to update the global auth state.
        await reloadUser()

        // 3. Invalidate the router to refetch all data with the new auth context.
        await router.invalidate()

        // 4. Redirect the user to the 'redirect' URL if it exists, otherwise to the homepage.
        navigate({ to: redirect || '/', replace: true })
      } else {
        // If there's an error or no token, redirect to login with an error message.
        const errorMessage = error || 'sso_failed'
        navigate({
          to: '/login',
          search: { error: errorMessage },
          replace: true,
        })
      }
    }

    handleAuth()
  }, [token, error, redirect, reloadUser, router, navigate])

  // Display a loading message while the authentication process is in progress.
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Authenticating...</h2>
        <p className="text-slate-500">Please wait while we sign you in.</p>
        <div className="mt-6 animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  )
}
