import { Link } from "@tanstack/react-router"
import type { LinkProps } from "@tanstack/react-router"
import type { ComponentType, SVGProps } from "react"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@workspace/ui/components"
import { ChevronDown, Database, FolderClosed } from "lucide-react"

type AddNewOption = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  slug: LinkProps["to"]
}

const addNewOptions: AddNewOption[] = [
  { icon: FolderClosed, label: "Project", slug: "/projects/create" },
  // { icon: Database, label: "Storage", slug: "/storage/create" },
]

export const Header = () => {
  return (
    <header className="relative sticky top-0 z-50 flex h-[55px] w-full items-center justify-between border-b bg-zinc-950 px-3">
      <div></div>

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
}
