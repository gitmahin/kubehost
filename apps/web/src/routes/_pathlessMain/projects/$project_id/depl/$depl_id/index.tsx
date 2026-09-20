import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_pathlessMain/projects/$project_id/depl/$depl_id/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_pathlessMain/projects/$project_id/depl/$depl_id/"!</div>
}
