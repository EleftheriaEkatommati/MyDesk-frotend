import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useAuth } from '../auth'
import {
  ArrowLeftOnRectangleIcon,
  BookmarkSquareIcon,
  ComputerDesktopIcon,
  HomeIcon,
  ChartBarIcon,
  QrCodeIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

export function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    // Invalidate to clear auth-dependent state and re-run loaders
    // before navigating to the logout page.
    router.invalidate().then(() => navigate({ to: '/logout' }))
  }

  const linkStyles = `
    flex items-center gap-3 px-3 py-2.5 rounded-lg
    text-slate-300 hover:text-white hover:bg-slate-700
    transition-colors duration-200 text-sm font-medium
  `
  const activeLinkStyles =
    'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 left-0 z-30 flex h-screen w-64 flex-col bg-slate-800 text-slate-200 shadow-xl transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <ComputerDesktopIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400">
            MyDesk
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/"
            className={linkStyles}
            activeProps={{ className: activeLinkStyles }}
          >
            <HomeIcon className="h-5 w-5" />
            Home
          </Link>
          {user && user?.role?.name !== 'admin' && (
            <Link
              to="/my-bookings"
              className={linkStyles}
              activeProps={{ className: activeLinkStyles }}
            >
              <BookmarkSquareIcon className="h-5 w-5" />
              My Bookings
            </Link>
          )}
          {user?.role?.name === 'admin' && (
            <>
              <Link
                to="/admin"
                className={linkStyles}
                activeProps={{ className: activeLinkStyles }}
              >
                <UserGroupIcon className="h-5 w-5" />
                User Management
              </Link>
              <Link
                to="/check-in"
                className={linkStyles}
                activeProps={{ className: activeLinkStyles }}
              >
                <QrCodeIcon className="h-5 w-5" />
                Check-In
              </Link>
              <Link
                to="/statistics"
                className={linkStyles}
                activeProps={{ className: activeLinkStyles }}
              >
                <ChartBarIcon className="h-5 w-5" />
                Statistics
              </Link>
            </>
          )}
        </nav>

        {user && (
          <div className="p-4 mt-auto border-t border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">
                  {user.name} {user.surname ?? ''}
                </p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                to="/profile"
                className={linkStyles}
                activeProps={{ className: activeLinkStyles }}
              >
                <UserCircleIcon className="h-5 w-5" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className={`${linkStyles} w-full text-red-400 hover:bg-red-500/20 hover:text-red-300`}
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        )}
        {!user && (
          <div className="p-4 mt-auto border-t border-slate-700 space-y-2">
            <Link
              to="/login"
              className={linkStyles}
              activeProps={{ className: activeLinkStyles }}
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              Login
            </Link>
            <Link
              to="/register"
              className={linkStyles}
              activeProps={{ className: activeLinkStyles }}
            >
              <UserCircleIcon className="h-5 w-5" />
              Register
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
