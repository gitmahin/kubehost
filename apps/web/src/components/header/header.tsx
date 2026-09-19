import { Link } from "@tanstack/react-router"
import type {  LinkProps } from "@tanstack/react-router"
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
    { icon: Database, label: "Storage", slug: "/storage/create" },
]

export const Header = () => {
    return (
        <header className="w-full flex justify-between items-center px-3 h-[55px] border-b sticky top-0">
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
                                            <Icon className="w-4 h-4" />
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