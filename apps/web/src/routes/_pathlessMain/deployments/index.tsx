import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_pathlessMain/deployments/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_pathlessMain/deployments/"!</div>
}
