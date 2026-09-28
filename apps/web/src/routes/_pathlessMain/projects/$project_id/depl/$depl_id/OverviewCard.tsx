import {
  Server,
  Globe,
  Boxes,
  ExternalLink,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { type DashboardData } from "./PodRestartsChart"


export type IngressRule = {
  name?: string
  host?: string
  path?: string
  pathType?: string
}


type OverviewCardPropsType = {
  deployment: DashboardData["deployment"]
  service: DashboardData["service"]
  uniqueIngress: IngressRule[]
}
const OverviewCard = ({ deployment, service, uniqueIngress }: OverviewCardPropsType) => {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Replicas
        </CardTitle>
        <Boxes className="h-4 w-4 text-zinc-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-50">
          {deployment?.replicas?.ready ?? 0} /{" "}
          {deployment?.replicas?.desired ?? 0}
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {deployment?.replicas?.available ?? 0} available,{" "}
          {deployment?.replicas?.updated ?? 0} updated
        </p>
      </CardContent>
    </Card>

    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Service IP
        </CardTitle>
        <Server className="h-4 w-4 text-zinc-500" />
      </CardHeader>
      <CardContent>
        <div className="font-mono text-lg font-semibold text-zinc-50">
          {service?.clusterIP ?? "No Service"}
        </div>
        <div className="mt-1 flex gap-2">
          {service?.ports?.map((p, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="bg-zinc-800 text-[10px] text-zinc-300"
            >
              {p.port}:{p.targetPort}/{p.protocol}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Ingress Host
        </CardTitle>
        <Globe className="h-4 w-4 text-zinc-500" />
      </CardHeader>
      <CardContent>
        {uniqueIngress.length > 0 ? (
          <div className="flex flex-col gap-1">
            {uniqueIngress.map((ing, i) => (
              <div
                key={`${ing.name ?? i}-${ing.host}`}
                className="flex items-center gap-1.5 font-mono text-sm text-blue-400"
              >
                <a
                  href={`http://${ing.host}${ing.path ?? ""}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  {ing.host}
                  {ing.path}
                  <ExternalLink className="h-3 w-3 text-zinc-500" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm text-zinc-500">
            No Ingress routing set
          </span>
        )}
      </CardContent>
    </Card>
  </div>
}

export default OverviewCard
