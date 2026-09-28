import Skeleton from "react-loading-skeleton"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@workspace/ui/components/table"
type Pod = {
  name?: string
  status?: string
  podIP?: string
  nodeName?: string
  restarts?: number
}
import { cn } from "@workspace/ui/lib/utils"

const statusStyles: Record<string, string> = {
  Running: "border-green-600/40 text-green-500 bg-green-500/10",
  Pending: "border-yellow-600/40 text-yellow-500 bg-yellow-500/10",
  Failed: "border-red-600/40 text-red-500 bg-red-500/10",
  Succeeded: "border-blue-600/40 text-blue-500 bg-blue-500/10",
}

function getStatusStyle(status?: string) {
  return (
    statusStyles[status ?? ""] ??
    "border-zinc-600/40 text-zinc-400 bg-zinc-500/10"
  )
}

type PodInstancesPropsType = {
  pods: Pod[]
}

export const PodInstances = ({pods}: PodInstancesPropsType) => {
  return  <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-zinc-100">Instances</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Metrics for active runtime containers
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            {pods.length} Total Pods
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Pod Name</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Pod IP</TableHead>
                  <TableHead className="text-zinc-400">Node</TableHead>
                  <TableHead className="text-zinc-400">Restarts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pods.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-sm text-zinc-500"
                    >
                      No active pods found
                    </TableCell>
                  </TableRow>
                ) : (
                  pods.map((pod) => (
                    <TableRow
                      key={pod.name}
                      className="border-zinc-800/60 hover:bg-zinc-800/30"
                    >
                      <TableCell className="font-mono text-xs text-zinc-200">
                        {pod.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(getStatusStyle(pod.status))}
                        >
                          {pod.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {pod.podIP ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {pod.nodeName ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {pod.restarts}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
}