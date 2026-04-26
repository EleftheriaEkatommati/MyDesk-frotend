import {
  createFileRoute,
  redirect,
  useLoaderData,
  useRouteContext,
} from '@tanstack/react-router'
import React, { useState } from 'react'
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { getUsers, updateUserRole, type User } from '../api'
import { authService } from '../auth'
import { deleteUser } from '../api'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/admin')({
  // 1. Loader για τη λήψη δεδομένων και την προστασία της διαδρομής
  loader: async ({ context }) => {
    await context.auth.ensureLoaded()
    const authState = authService.getState()
    // Only allow access if the user is authenticated and has the 'admin' role. Otherwise, redirect to login.
    if (!authState.user || authState.user?.role?.name !== 'admin') {
      throw redirect({
        to: '/login',
        search: {
          // Redirect back to the admin page after successful login
          redirect: location.href,
        },
      })
    }
    //  Fetch the list of users for the admin dashboard. This will be passed to the component via useLoaderData.
    const users = await getUsers(authState.token!)
    return { users }
  },
  component: AdminPage,
})

function AdminPage() {
  // Get the initial list of users from the loader data. This is the data that was fetched on the server before rendering the page.
  const loaderData = useLoaderData({ from: '/admin' })
  const [users, setUsers] = useState(loaderData.users)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
          User Management
        </h1>
      </div>
      <div className="overflow-x-auto bg-white dark:bg-slate-800/75 rounded-xl shadow-lg">
        <div className="align-middle inline-block min-w-full">
          <table className="min-w-full">
            <thead className="bg-slate-100/80 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  Role
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.length > 0 ? (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    setUsers={setUsers}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Component for rendering each user row in the admin dashboard. It includes buttons for promoting/demoting user roles and deleting users, with appropriate confirmation and error handling.
function UserRow({
  user,
  setUsers,
}: {
  user: User
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
}) {
  const { auth } = useRouteContext({ from: '__root__' })
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleChange = async (newRole: 'admin' | 'user') => {
    if (!auth.token || !auth.user) return

    if (auth.user.id === user.id && newRole === 'user') {
      toast.error('You cannot remove your own admin privileges.')
      return
    }

    setIsLoading(true)

    try {
      const updatedUser = await updateUserRole(
        user.id,
        { role: newRole },
        auth.token,
      )
      // On success, update the user in the list with the definitive data from the server.
      setUsers((p) => p.map((u) => (u.id === user.id ? updatedUser : u)))
      toast.success(`User ${user.name}'s role updated to ${newRole}.`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to update user role.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!auth.token) return
    if (
      !window.confirm(
        `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      )
    )
      return

    setIsLoading(true)

    try {
      await deleteUser(user.id, auth.token)
      // On success, remove the user from the list.
      setUsers((p) => p.filter((u) => u.id !== user.id))
      toast.success(`User ${user.name} has been deleted.`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete user.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <tr className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-700">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 dark:from-indigo-800 dark:to-blue-900 flex items-center justify-center">
            <span className="font-bold text-indigo-600 dark:text-indigo-200">
              {user.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {user.name ?? ''} {user.surname ?? ''}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {user.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize leading-tight ${
            user.role?.name === 'admin'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
          }`}
        >
          {user.role?.name}
        </span>
      </td>
      <td className="px-6 py-4 flex items-center justify-center gap-2">
        {isLoading ? (
          <div className="p-2">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {user.role?.name === 'user' ? (
              <button
                onClick={() => handleRoleChange('admin')}
                title="Promote to Admin"
                className="p-2 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <ArrowUpCircleIcon className="h-6 w-6" />
              </button>
            ) : (
              <button
                onClick={() => handleRoleChange('user')}
                disabled={auth.user?.id === user.id}
                title="Demote to User"
                className="p-2 rounded-full text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownCircleIcon className="h-6 w-6" />
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={auth.user?.id === user.id}
              title="Delete User"
              className="p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrashIcon className="h-6 w-6" />
            </button>
          </>
        )}
      </td>
    </tr>
  )
}
