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
  const { users } = useLoaderData({ from: '/admin' })

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Admin - User Management</h1>

      <CreateUserForm />

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
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Component για μια σειρά χρήστη με λειτουργικότητα ενημέρωσης ρόλου
function UserRow({ user }: { user: User }) {
  const { auth } = useRouteContext({ from: '__root__' })
  const navigate = useNavigate()

  const handleRoleChange = async (newRole: 'admin' | 'user') => {
    if (!auth.token || !auth.user) return
    // Αποτροπή του διαχειριστή από το να υποβαθμίσει τον εαυτό του
    if (auth.user.id === user.id && newRole === 'user') {
      alert('You cannot remove your own admin privileges.')
      return
    }

    try {
      await updateUserRole(user.id, { role: newRole }, auth.token)
      // Ανανέωση δεδομένων με πλοήγηση στην ίδια διαδρομή
      navigate({ to: '/admin' })
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role. See console for details.')
    }
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-slate-700">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">
        {user.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
        <div className="font-medium">
          {user.name ?? ''} {user.surname ?? ''}
        </div>
        <div className="text-gray-500 dark:text-slate-400">{user.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
        {user.role?.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {user.role?.name === 'user' ? (
          <button
            onClick={() => handleRoleChange('admin')}
            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Make Admin
          </button>
        ) : (
          <button
            onClick={() => handleRoleChange('user')}
            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-500 dark:hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={auth.user?.id === user.id}
          >
            Make User
          </button>
        )}
      </td>
    </tr>
  )
}

// Component για τη δημιουργία νέου χρήστη
function CreateUserForm() {
  const { auth } = useRouteContext({ from: '__root__' })
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!auth.token) return

    const formData = new FormData(e.currentTarget)
    const newUser = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: (formData.get('name') as string) || undefined,
      surname: (formData.get('surname') as string) || undefined,
    }

    try {
      await createUser(newUser, auth.token)
      e.currentTarget.reset()
      navigate({ to: '/admin' }) // Ανανέωση δεδομένων
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.'
      setError(`Failed to create user: ${message}`)
      console.error(err)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Create New User</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="email"
            type="email"
            placeholder="Email (required)"
            required
            className="p-2 border rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (required)"
            required
            className="p-2 border rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          />
          <input
            name="name"
            placeholder="Name"
            className="p-2 border rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          />
          <input
            name="surname"
            placeholder="Surname"
            className="p-2 border rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Create User
        </button>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </form>
    </div>
  )
}
