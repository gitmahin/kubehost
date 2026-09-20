import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  Rocket,
  Plus,
  Layers,
  Cpu,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  HelpCircle,
} from "lucide-react"

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@workspace/ui/components"

export const Route = createFileRoute("/_pathlessMain/projects/$project_id/")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { project_id } = Route.useParams()

  return (
    <div className="mx-auto max-w-7xl flex-1 space-y-6 p-6 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Deployment Dashboard
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              {project_id}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Rapidly deploy and run your containers without infrastructure
            overhead.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <HelpCircle className="mr-2 h-4 w-4" />
            Documentation
          </Button>
        </div>
      </div>

      {/* Main Hero Empty State */}
      <Card className="border-dashed bg-gradient-to-b from-card to-muted/20">
        <CardContent className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Rocket className="h-8 w-8" />
          </div>

          <CardTitle className="max-w-lg text-2xl font-bold tracking-tight sm:text-3xl">
            Rapidly deploy your application in seconds
          </CardTitle>
          <CardDescription className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            Just provide your Docker image - our platform handles networking,
            ingress rules, and scaling complexities behind the scenes.
          </CardDescription>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="px-6"
              onClick={() => {
                navigate({
                  to: "/projects/create/application",
                  search: {
                    project_name: project_id,
                  },
                })
              }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Deployment
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-6"
              onClick={() => {
                navigate({
                  to: "/projects/create",
                })
              }}
            >
              Create New Project
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Value Propositions / Managed Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <Layers className="mb-2 h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Kubernetes Powered
            </CardTitle>
            <CardDescription>
              Built on enterprise Kubernetes without requiring YAML manifests,
              kubectl commands, or cluster tuning.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Cpu className="mb-2 h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Automated Networking
            </CardTitle>
            <CardDescription>
              Load balancing, ingress routes, and SSL certificates are
              provisioned and configured automatically.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Zero-Config Docker
            </CardTitle>
            <CardDescription>
              Pass your image URI from Docker Hub or standard registries and hit
              deploy-we handle the rest.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
