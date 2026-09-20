import { useMemo } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import Skeleton from "react-loading-skeleton"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@workspace/ui/components/table"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import { projectService } from "@/lib/service"
import { EmptyDeployment } from "@/components/deployments/EmptyView"

type DeploymentsSearch = {
  project?: string
}

export const Route = createFileRoute("/_pathlessMain/deployments/")({
  validateSearch: (search: Record<string, unknown>): DeploymentsSearch => {
    return {
      project: (search.project as string) || "all",
    }
  },
  component: RouteComponent,
})

type Deployment = {
  name?: string
  namespace?: string
  image?: { name?: string; pullPolicy?: string }
  container?: {
    name?: string
    port?: number
    command?: string[]
    args?: string[]
    workingDir?: string
  }
  resources?: {
    requests?: Record<string, string>
    limits?: Record<string, string>
  }
  replicas?: {
    desired: number
    ready: number
    available: number
    updated: number
  }
  status?: string
  statusMessage?: string
  createdAt?: string
  labels?: Record<string, string>
}

type Project = {
  name?: string
}

const statusStyles: Record<string, string> = {
  Running: "border-green-600/40 text-green-500 bg-green-500/10",
  "Not Ready": "border-yellow-600/40 text-yellow-500 bg-yellow-500/10",
  Progressing: "border-blue-600/40 text-blue-500 bg-blue-500/10",
  Failed: "border-red-600/40 text-red-500 bg-red-500/10",
}

function getStatusStyle(status?: string) {
  return (
    statusStyles[status ?? ""] ?? "border-zinc-600/40 text-zinc-400 bg-zinc-500/10"
  )
}

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function RouteComponent() {
  const navigate = useNavigate()
  const { project: selectedProject = "all" } = Route.useSearch()

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res: any = await projectService.listAllProjects()
      return (res?.data.data ?? []) as Project[]
    },
  })

  const { data: deployments = [], isLoading, isFetching } = useQuery({
    queryKey: ["deployments", selectedProject],
    queryFn: async () => {
      const res: any = await projectService.getAllDeployments(
        (selectedProject === "all" ? "" : selectedProject) as string
      )
      return (res?.data.data ?? []) as Deployment[]
    },
  })

  const columns = useMemo<ColumnDef<Deployment>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-zinc-50">
              {row.original.name}
            </span>
            <span className="text-xs text-zinc-500">
              {row.original.namespace}
            </span>
          </div>
        ),
      },
      {
        header: "Image",
        accessorFn: (row) => row.image?.name,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-zinc-400 truncate block max-w-[220px]">
            {getValue<string>() ?? "-"}
          </span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <Badge
              variant="outline"
              className={cn(getStatusStyle(row.original.status))}
            >
              {row.original.status}
            </Badge>
            {row.original.statusMessage && (
              <span className="text-[11px] text-zinc-500 truncate max-w-[200px]">
                {row.original.statusMessage}
              </span>
            )}
          </div>
        ),
      },
      {
        header: "Replicas",
        accessorFn: (row) => row.replicas,
        cell: ({ getValue }) => {
          const r = getValue<Deployment["replicas"]>()
          if (!r) return "-"
          const healthy = r.ready === r.desired
          return (
            <span className={cn(healthy ? "text-zinc-300" : "text-yellow-500")}>
              {r.ready}/{r.desired} ready
            </span>
          )
        },
      },
      {
        header: "Port",
        accessorFn: (row) => row.container?.port,
        cell: ({ getValue }) => (
          <span className="text-sm text-zinc-400">
            {getValue<number>() ?? "-"}
          </span>
        ),
      },
      {
        header: "Created",
        accessorKey: "createdAt",
        cell: ({ getValue }) => (
          <span className="text-sm text-zinc-500">
            {formatRelativeTime(getValue<string>())}
          </span>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: deployments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleProjectChange = (value: string) => {
    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        project: value === "all" ? undefined : value,
      }),
      replace: true,
    })
  }

  const isTableLoading = isLoading || isFetching

  if(deployments.length === 0) {
    return <EmptyDeployment/>
  }

  return (
    <div className="w-full p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-50">Deployments</h1>

        <Select
          value={selectedProject}
          // @ts-ignore
          onValueChange={handleProjectChange}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.name} value={project.name!}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isTableLoading &&
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Skeleton width={120} height={16} baseColor="#27272a" highlightColor="#3f3f46" />
                      <Skeleton width={80} height={12} baseColor="#27272a" highlightColor="#3f3f46" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton width={150} height={14} baseColor="#27272a" highlightColor="#3f3f46" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={70} height={20} borderRadius={6} baseColor="#27272a" highlightColor="#3f3f46" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={80} height={14} baseColor="#27272a" highlightColor="#3f3f46" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={40} height={14} baseColor="#27272a" highlightColor="#3f3f46" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={60} height={14} baseColor="#27272a" highlightColor="#3f3f46" />
                  </TableCell>
                </TableRow>
              ))}

            {!isTableLoading && deployments.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-zinc-500 py-8">
                  No deployments found
                </TableCell>
              </TableRow>
            )}

            {!isTableLoading &&
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-zinc-900/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}