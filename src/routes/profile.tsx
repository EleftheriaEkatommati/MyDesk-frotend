import {
  createFileRoute,
  redirect,
  useLoaderData,
  useRouter,
  useRouteContext,
} from '@tanstack/react-router'
import React, { useState } from 'react'
import { type User, updateUserProfile } from '../api'
import { authService } from '../auth'

export const Route = createFileRoute('/profile')({
  // 1. Loader to fetch user data and protect the route
  loader: async ({ context }) => {
    await context.auth.ensureLoaded()
    const authState = authService.getState()

    // If user is not authenticated, redirect to login
    if (!authState.user) {
      throw redirect({
        to: '/login',
        search: {
          // Redirect back to the profile page after login
          redirect: location.href,
        },
      })
    }

    // The user object is already available in the auth context
    // so we can just return it.
    return { user: authState.user }
  },
  // 2. Component to render the page
  component: ProfilePage,
})

function ProfilePage() {
  // 3. Get user data from the loader
  const { user } = useLoaderData({ from: '/profile' })
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          My Profile
        </h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
        {isEditing ? (
          <ProfileForm
            user={user}
            onSaveSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <ProfileView user={user} />
        )}
      </div>
    </div>
  )
}

// Component to display user info
function ProfileView({ user }: { user: User }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <InfoField label="Name" value={user.name} />
      <InfoField label="Surname" value={user.surname} />
      <InfoField label="Email" value={user.email} />
      <InfoField label="Role" value={user.role?.name} />
    </div>
  )
}

// Component for the profile editing form
function ProfileForm({
  user,
  onSaveSuccess,
  onCancel,
}: {
  user: User
  onSaveSuccess: () => void
  onCancel: () => void
}) {
  const { auth } = useRouteContext({ from: '__root__' })
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!auth.token || !auth.reloadUser) return

    const formData = new FormData(e.currentTarget)
    const updatedProfile = {
      name: formData.get('name') as string,
      surname: (formData.get('surname') as string) || undefined,
    }

    try {
      await updateUserProfile(updatedProfile, auth.token)
      await auth.reloadUser() // Refresh user data in auth context
      router.invalidate() // Invalidate router to refetch data for the page
      onSaveSuccess()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.'
      setError(`Failed to update profile: ${message}`)
      console.error(err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={user.name}
            required
            className="mt-1 p-2 border rounded-md w-full dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          />
        </div>
        <div>
          <label
            htmlFor="surname"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Surname
          </label>
          <input
            id="surname"
            name="surname"
            type="text"
            defaultValue={user.surname ?? ''}
            className="mt-1 p-2 border rounded-md w-full dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          // FIXME: The backend endpoint for updating a user profile does not exist.
          // Disabling this feature until the API is implemented.
          disabled={true}
          title="Profile editing is currently disabled."
        >
          Save Changes
        </button>
      </div>
    </form>
  )
}

// Helper component for displaying user information fields
function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </h2>
      <p className="mt-1 text-lg text-gray-900 dark:text-gray-100">
        {value || (
          <span className="text-gray-400 dark:text-gray-500">Not set</span>
        )}
      </p>
    </div>
  )
}
