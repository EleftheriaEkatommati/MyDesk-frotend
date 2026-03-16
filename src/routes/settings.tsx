import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  return (
    <div className="p-2">
      <h2 className="text-2xl font-bold">Settings</h2>
    </div>
  )
}
