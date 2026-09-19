import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_pathlessMain/images/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_pathlessMain/images/"!</div>
}
