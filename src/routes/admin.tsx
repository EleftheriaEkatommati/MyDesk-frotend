import {
  createFileRoute,
  redirect,
  useLoaderData,
  useNavigate,
  useRouteContext,
} from '@tanstack/react-router'
import React, { useState } from 'react'
import { createUser, getUsers, updateUserRole, type User } from '../api'
import { authService } from '../auth'
import { deleteUser } from '../api'

export const Route = createFileRoute('/admin')({
  // 1. Loader για τη λήψη δεδομένων και την προστασία της διαδρομής
  loader: async ({ context }) => {
    await context.auth.ensureLoaded()
    const authState = authService.getState()
    // Ανακατεύθυνση εάν ο χρήστης δεν είναι συνδεδεμένος ή δεν είναι διαχειριστής
    if (!authState.user || authState.user?.role?.name !== 'admin') {
      throw redirect({
        to: '/login',
        search: {
          // Ανακατεύθυνση πίσω στη σελίδα admin μετά τη σύνδεση
          redirect: location.href,
        },
      })
    }
    // Λήψη χρηστών εάν υπάρχει εξουσιοδότηση
    const users = await getUsers(authState.token!)
    return { users }
  },
  // 2. Component για την απόδοση της σελίδας
  component: AdminPage,
})

function AdminPage() {
  // 3. Λήψη δεδομένων χρηστών από το loader
  const loaderData = useLoaderData({ from: '/admin' })
  const [users, setUsers] = useState(loaderData.users)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin - User Management</h1>
      <div className="mt-8 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <div className="shadow border-b border-gray-200 dark:border-slate-700 sm:rounded-lg">
          <table className="min-w-full bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {users.length > 0 ? (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    users={users}
                    setUsers={setUsers}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
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

// Component για μια σειρά χρήστη με λειτουργικότητα ενημέρωσης ρόλου
function UserRow({
  user,
  users,
  setUsers,
}: {
  user: User
  users: User[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
}) {
  const { auth } = useRouteContext({ from: '__root__' })
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleRoleChange = async (newRole: 'admin' | 'user') => {
    if (!auth.token || !auth.user) return

    if (auth.user.id === user.id && newRole === 'user') {
      alert('You cannot remove your own admin privileges.')
      return
    }

    const prevUsers = [...users]
    setLoading(true)

    setUsers((p) =>
      p.map((u) =>
        u.id === user.id
          ? {
              ...u,
              role: {
                id: u.role?.id ?? 0, // fallback to something valid
                name: newRole,
              },
            }
          : u,
      ),
    )

    try {
      await updateUserRole(user.id, { role: newRole }, auth.token)
    } catch (error) {
      console.error(error)
      setUsers(prevUsers)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!auth.token) return
    if (!confirm('Delete this user?')) return

    const prevUsers = [...users]

    setUsers((p) => p.filter((u) => u.id !== user.id))

    try {
      await deleteUser(user.id, auth.token)
    } catch (error) {
      console.error(error)
      setUsers(prevUsers)
    }
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-slate-700">
      <td className="px-6 py-4">{user.id}</td>

      <td className="px-6 py-4">
        <div className="font-medium">
          {user.name ?? ''} {user.surname ?? ''}
        </div>
        <div className="text-gray-500">{user.email}</div>
      </td>

      <td className="px-6 py-4">{user.role?.name}</td>

      <td className="px-6 py-4 flex gap-3">
        {user.role?.name === 'user' ? (
          <button
            onClick={() => handleRoleChange('admin')}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Make Admin
          </button>
        ) : (
          <button
            onClick={() => handleRoleChange('user')}
            disabled={auth.user?.id === user.id}
            className="text-yellow-600 hover:underline disabled:opacity-50 dark:text-yellow-500"
          >
            Make User
          </button>
        )}

        <button
          onClick={handleDelete}
          className="ml-3 text-red-600 hover:underline dark:text-red-400"
        >
          Delete
        </button>
      </td>
    </tr>
  )
}
