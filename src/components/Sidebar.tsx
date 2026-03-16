import { Link } from '@tanstack/react-router'

export function Sidebar() {
  return (
    <aside className="flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto bg-gray-50 border-r dark:bg-gray-900 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white px-4 mb-6">
        My App
      </h2>

      <div className="flex flex-col justify-between flex-1">
        <nav className="space-y-2">
          <Link
            to="/"
            className="flex items-center px-4 py-2 text-gray-700 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 [&.active]:bg-gray-200 dark:[&.active]:bg-gray-800 dark:[&.active]:text-gray-200"
          >
            <span className="font-medium">Home Screen</span>
          </Link>

          <Link
            to="/the-plan"
            className="flex items-center px-4 py-2 text-gray-700 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 [&.active]:bg-gray-200 dark:[&.active]:bg-gray-800 dark:[&.active]:text-gray-200"
          >
            <span className="font-medium">The Plan</span>
          </Link>

          <Link
            to="/settings"
            className="flex items-center px-4 py-2 text-gray-700 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 [&.active]:bg-gray-200 dark:[&.active]:bg-gray-800 dark:[&.active]:text-gray-200"
          >
            <span className="font-medium">Settings</span>
          </Link>

          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <Link
              to="/login"
              className="flex items-center px-4 py-2 text-gray-700 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 [&.active]:bg-gray-200 dark:[&.active]:bg-gray-800 dark:[&.active]:text-gray-200"
            >
              <span className="font-medium">Login</span>
            </Link>
            <Link
              to="/register"
              className="flex items-center px-4 py-2 text-gray-700 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 [&.active]:bg-gray-200 dark:[&.active]:bg-gray-800 dark:[&.active]:text-gray-200"
            >
              <span className="font-medium">Sign Up</span>
            </Link>
            <Link
              to="/logout"
              className="flex items-center px-4 py-2 text-red-600 transition-colors duration-300 transform rounded-lg dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
            >
              <span className="font-medium">Log Out</span>
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  )
}
