import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useAuth } from '../auth'

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    // Invalidate to clear auth-dependent state and re-run loaders
    // before navigating to the logout page.
    router.invalidate().then(() => navigate({ to: '/logout' }))
  }

  const linkStyles =
    'block px-3 py-2 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white'
  const activeLinkStyles = 'bg-slate-900/50 text-white font-semibold'

  return (
    <aside className="sticky top-0 flex h-screen flex-col w-64 bg-slate-800 text-slate-200">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">MyDesk</h1>
        {user && (
          <div className="mt-2 text-sm text-slate-400">
            <p className="font-semibold text-slate-300">
              Welcome, {user.name} {user.surname ?? ''}
            </p>
            <p className="font-mono text-xs">{user.email}</p>
          </div>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <Link
          to="/"
          className={linkStyles}
          activeProps={{ className: activeLinkStyles }}
        >
          Home
        </Link>
        {user && (
          <Link
            to="/my-bookings"
            className={linkStyles}
            activeProps={{ className: activeLinkStyles }}
          >
            My Bookings
          </Link>
        )}
        <Link
          to="/about"
          className={linkStyles}
          activeProps={{ className: activeLinkStyles }}
        >
          About
        </Link>
        {user?.role?.name === 'admin' && (
          <Link
            to="/admin"
            className={linkStyles}
            activeProps={{ className: activeLinkStyles }}
          >
            Admin
          </Link>
        )}
        {user?.role?.name === 'admin' && (
          <>
            <Link
              to="/check-in"
              className={linkStyles}
              activeProps={{ className: activeLinkStyles }}
            >
              Check-In
            </Link>
          </>
        )}
      </nav>
      {user && (
        <div className="p-4 mt-auto border-t border-slate-700 space-y-2">
          <Link
            to="/profile"
            className={linkStyles}
            activeProps={{ className: activeLinkStyles }}
          >
            Profile
          </Link>
          <Link
            to="/settings"
            className={linkStyles}
            activeProps={{ className: activeLinkStyles }}
          >
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-md text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  )
}
