import { useState } from "react"
import type { ComponentType, SVGProps } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import type { LinkProps } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import { Docker, Kubernetes } from "@workspace/ui/components/icons"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  FolderKanban,
  FolderPlus,
  Globe,
  Rocket,
  HardDrive,
  Image as ImageIcon,
  ChevronDown,
  Circle,
  Box,
  LayoutGrid,
  Database,
} from "lucide-react"
import { projectService } from "@/lib/service"
import { useQuery } from "@tanstack/react-query"
import Skeleton from "react-loading-skeleton"

type SidebarLinkType = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  slug: LinkProps["to"]
}

type Project = {
  id: string
  name: string
}

const SidebarLinks: SidebarLinkType[] = [
  { icon: Globe, label: "Domains", slug: "/domains" },
  { icon: Box, label: "Deployments", slug: "/deployments" },
  // { icon: Database, label: "Storage", slug: "/storage" },
  { icon: Docker, label: "Images", slug: "/images" },
]

const APP_VERSION = "v1.0.0"

const linkClass = (isActive: boolean) =>
  `flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors ${
    isActive
      ? "bg-zinc-800 text-zinc-50 font-medium"
      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
  }`

export const Sidebar = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res: any = await projectService.listAllProjects()
      return (res?.data.data ?? []) as Project[]
    },
  })

  const isProjectsSectionActive = pathname.startsWith("/projects")
  const [projectsOpen, setProjectsOpen] = useState(isProjectsSectionActive)

  return (
    <aside className="sticky top-0 left-0 flex h-screen w-[250px] shrink-0 flex-col border-r">
      <div className="flex items-center gap-2 px-5 py-5 ">
        <Link to="/"><Kubernetes className="h-6 w-6 shrink-0"  /></Link>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold">KubeHost</span>
          <span className="text-xs text-gray-400">{APP_VERSION}</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
          <CollapsibleTrigger
            className={`${linkClass(isProjectsSectionActive)} w-full justify-between`}
          >
            <span className="flex items-center gap-3">
              <LayoutGrid className="h-4 w-4 shrink-0" />
              Projects
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${
                projectsOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-1 ml-5 flex flex-col gap-1 border-l pl-2">
            {isLoading && (
              <div className="flex flex-col gap-2 px-2">
                {Array.from({ length: 4 }).map((_, index) => {
                  const widths = [130, 85, 115, 70]
                  const currentWidth = widths[index % widths.length]

                  return (
                    <div
                      key={index}
                      className="flex h-7 w-full items-center justify-between"
                    >
                      <Skeleton width={currentWidth} height={20} />
                    </div>
                  )
                })}
              </div>
            )}

            {!isLoading && projects.length === 0 && (
              <span className="px-3 py-1.5 text-xs text-zinc-500">
                No projects yet
              </span>
            )}

            {projects.map((project) => {
              const slug = `/projects/${project.name}` as LinkProps["to"]
              const isActive = pathname === slug
              return (
                <Link
                  key={project.name}
                  to={slug}
                  className={linkClass(isActive)}
                >
                  <span className="truncate">{project.name}</span>
                </Link>
              )
            })}
          </CollapsibleContent>
        </Collapsible>

        {SidebarLinks.map(({ icon: Icon, label, slug }) => {
          const isActive = pathname === slug
          return (
            <Link key={slug} to={slug} className={linkClass(isActive)}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
