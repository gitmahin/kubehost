import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_pathlessMain/domains/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_pathlessMain/domains/"!</div>
}
