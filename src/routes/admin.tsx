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
      <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-200">
        User Management
      </h1>
      <div className="mt-8 overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="align-middle inline-block min-w-full">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                    users={users}
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
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <span className="font-bold text-slate-500 dark:text-slate-400">
              {user.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-200">
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
      <td className="px-6 py-4 flex items-center gap-3">
        {user.role?.name === 'user' ? (
          <button
            onClick={() => handleRoleChange('admin')}
            className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:shadow-sm hover:-translate-y-px transition-all duration-150"
          >
            Make Admin
          </button>
        ) : (
          <button
            onClick={() => handleRoleChange('user')}
            disabled={auth.user?.id === user.id}
            className="px-3 py-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-600 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/50 hover:shadow-sm hover:-translate-y-px transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            Make User
          </button>
        )}
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 hover:shadow-sm hover:-translate-y-px transition-all duration-150"
        >
          Delete
        </button>
      </td>
    </tr>
  )
}
