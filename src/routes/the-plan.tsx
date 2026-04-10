import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/the-plan')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/the-plan"!</div>
}
