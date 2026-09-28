import { Link } from "@tanstack/react-router"
import type { LinkProps } from "@tanstack/react-router"
import type { ComponentType, SVGProps } from "react"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@workspace/ui/components"
import {
  ChevronDown,
  Cpu,
  Database,
  FolderClosed,
  HardDrive,
  Server,
} from "lucide-react"
import { metricsStore } from "@/stores"
import { observer } from "mobx-react"

type AddNewOption = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  slug: LinkProps["to"]
}

const addNewOptions: AddNewOption[] = [
  { icon: FolderClosed, label: "Project", slug: "/projects/create" },
  // { icon: Database, label: "Storage", slug: "/storage/create" },
]

export const Header = observer(() => {
  const { metrics, systemMemoryUsedPercent, totalConsumedCpu } = metricsStore

  const sysMem = metrics?.memory?.system
  const cpu = metrics?.cpu
  const storage = metrics?.storage

  const cpuUsagePercent =
    cpu?.cores && cpu.totalConsumedCpu != null
      ? (cpu.totalConsumedCpu / cpu.cores) * 100
      : 0

  const cpuColor =
    cpuUsagePercent >= 85
      ? "text-red-500"
      : cpuUsagePercent >= 70
        ? "text-amber-500"
        : "text-emerald-500"

  const reservedCpuPercent =
    cpu?.cores && cpu.totalReservedCpu != null
      ? (cpu.totalReservedCpu / cpu.cores) * 100
      : 0

  const reservedCpuColor =
    reservedCpuPercent >= 90
      ? "text-red-500"
      : reservedCpuPercent >= 75
        ? "text-amber-500"
        : "text-emerald-500"

  return (
    <header className="relative sticky top-0 z-50 flex h-[55px] w-full items-center justify-between border-b bg-zinc-950 px-3">
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {/* System Memory Badge */}
        <Badge variant="outline" className="shrink-0 gap-1.5">
          <Server className="h-3.5 w-3.5 text-primary" />
          <span>Sys RAM:</span>
          <span>
            {sysMem?.usedGB?.toFixed(1) ?? 0} /{" "}
            {sysMem?.totalGB?.toFixed(1) ?? 0} GB
          </span>
          <span className="text-zinc-500">({systemMemoryUsedPercent}%)</span>
        </Badge>

        {/* Storage Badge */}
        <Badge variant="outline" className="shrink-0 gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-primary" />
          <span>Sys Disk:</span>
          <span>
            {storage?.usedGB?.toFixed(1) ?? 0} /{" "}
            {storage?.totalGB?.toFixed(1) ?? 0} GB
          </span>
          <span className="text-zinc-500">({storage?.usedPercent ?? 0}%)</span>
        </Badge>

        {/* CPU Usage Badge */}
        <Badge variant="outline" className="shrink-0 gap-1.5">
          <Cpu className={`h-3.5 w-3.5 ${cpuColor}`} />

          <span>CPU:</span>

          {/* Current CPU usage */}
          <span className={`font-medium ${cpuColor}`}>
            {cpu?.totalConsumedCpu?.toFixed(2) ?? "0.00"} Cores
          </span>

          <span className="text-zinc-400">({cpuUsagePercent.toFixed(1)}%)</span>

          <span className="text-zinc-400">•</span>

          {/* Reserved CPU */}
          <span className={`font-medium ${reservedCpuColor}`}>
            {cpu?.totalReservedCpu?.toFixed(2) ?? "0.00"} Cores
          </span>

          <span className="text-zinc-400">reserved</span>

          <span className={`font-medium ${reservedCpuColor}`}>
            ({reservedCpuPercent.toFixed(1)}%)
          </span>
        </Badge>
      </div>

      <div className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button>
              Add New <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            <DropdownMenuGroup>
              {addNewOptions.map(({ icon: Icon, label, slug }) => (
                <Link to={slug}>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full justify-start"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
})
