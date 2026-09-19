import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_pathlessMain/storage/create/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_pathlessMain/storage/create/"!</div>
}
