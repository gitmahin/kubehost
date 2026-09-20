import { useMemo } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
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
import { Badge } from "@workspace/ui/components/badge"
import { projectService } from "@/lib/service"

export const Route = createFileRoute("/_pathlessMain/domains/")({
  component: RouteComponent,
})

type Domain = {
  host: string
  namespace: string
  ingress: string
}

function RouteComponent() {
  const { data: domains = [], isLoading, isFetching } = useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const res: any = await projectService.getAllDomains()
      return (res?.data?.data ?? res?.data ?? []) as Domain[]
    },
  })

  const columns = useMemo<ColumnDef<Domain>[]>(
    () => [
      {
        header: "Host",
        accessorKey: "host",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm font-medium text-zinc-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        header: "Project",
        accessorKey: "namespace",
        cell: ({ getValue }) => (
          <Badge variant="outline" className="border-zinc-700 text-zinc-300 bg-zinc-800/40">
            {getValue<string>()}
          </Badge>
        ),
      },
      {
        header: "Service",
        accessorKey: "ingress",
        cell: ({ getValue }) => (
          <span className="text-sm text-zinc-400">
            {getValue<string>()}
          </span>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: domains,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const isTableLoading = isLoading || isFetching
  const skeletonWidths = [180, 110, 140, 95]

  return (
    <div className="w-full p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-50">Domains</h1>
      </div>

      <div className="rounded-md border border-zinc-800">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-zinc-800 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-zinc-400">
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
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index} className="border-zinc-800/60">
                  <TableCell>
                    <Skeleton
                      width={skeletonWidths[index % skeletonWidths.length]}
                      height={16}
                      baseColor="#27272a"
                      highlightColor="#3f3f46"
                    />
                  </TableCell>
                  <TableCell>
                    <Skeleton
                      width={80}
                      height={20}
                      borderRadius={6}
                      baseColor="#27272a"
                      highlightColor="#3f3f46"
                    />
                  </TableCell>
                  <TableCell>
                    <Skeleton
                      width={120}
                      height={16}
                      baseColor="#27272a"
                      highlightColor="#3f3f46"
                    />
                  </TableCell>
                </TableRow>
              ))}

            {!isTableLoading && domains.length === 0 && (
              <TableRow className="border-zinc-800">
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-zinc-500 py-8 text-sm"
                >
                  No domains configured
                </TableCell>
              </TableRow>
            )}

            {!isTableLoading &&
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-zinc-800/60 hover:bg-zinc-900/50"
                >
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