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
  const { metrics, systemMemoryUsedPercent } = metricsStore

  const sysMem = metrics?.memory?.system
  const cpu = metrics?.cpu
  const storage = metrics?.storage

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
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span>CPU:</span>
          <span>{cpu?.totalSeconds?.toFixed(2) ?? "0.00"}s</span>
          {cpu?.cores && (
            <span className="text-zinc-500">({cpu.cores} Cores)</span>
          )}
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
