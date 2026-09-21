import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
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
import { EmptyDeployment } from "@/components/deployments/EmptyView"
import Skeleton from "react-loading-skeleton"
import { ProjectService } from "@repo/services"
import { getClientEnv } from "@/utils/env"

export const Route = createFileRoute("/_pathlessMain/images/")({
  component: RouteComponent,
})

type Deployment = {
  image?: string | { name?: string; pullPolicy?: string }
  images?: string[]
  createdAt?: string
}

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "-"
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export function RouteComponent() {
  const projectService = new ProjectService(
 getClientEnv("VITE_API_SERVER_URL") + "/v1/projects"
)
  const {
    data: deployments = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["deployments", "all"],
    queryFn: async () => {
      const res: any = await projectService.getAllDeployments("")
      return (res?.data?.deployments ??
        res?.data?.data ??
        res?.data ??
        []) as Deployment[]
    },
  })

  const columns: ColumnDef<Deployment>[] = [
    {
      header: "Image",
      accessorFn: (row) => {
        if (typeof row.image === "string") return row.image
        if (row.image?.name) return row.image.name
        if (Array.isArray(row.images) && row.images.length > 0)
          return row.images[0]
        return "-"
      },
      cell: ({ getValue }) => (
        <span className="block truncate font-mono text-sm text-zinc-300">
          {getValue<string>()}
        </span>
      ),
    },
    {
      header: "Pulled / Created",
      accessorKey: "createdAt",
      cell: ({ getValue }) => (
        <span className="text-sm text-zinc-400">
          {formatRelativeTime(getValue<string>())}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data: deployments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const isTableLoading = isLoading || isFetching

  if (!isTableLoading && deployments.length === 0) {
    return <EmptyDeployment />
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-50">Images</h1>
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
                    <Skeleton className="h-4 w-[280px] bg-zinc-800" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px] bg-zinc-800" />
                  </TableCell>
                </TableRow>
              ))}

            {!isTableLoading &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-zinc-900/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
