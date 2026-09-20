import { useNavigate } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@workspace/ui/components/empty"
import { Plus, Rocket } from "lucide-react"

export const EmptyDeployment = () => {
  const navigate = useNavigate()
  return (
    <Empty className="mt-20">
      <EmptyMedia>
        <Rocket className="h-10 w-10 text-muted-foreground" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle className="text-lg">No deployments available</EmptyTitle>
        <EmptyDescription>
          You currently have no active deployments in this project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          size="lg"
          onClick={() => {
            navigate({
              to: "/projects/create",
            })
          }}
        >
          <Plus />
          Create New Project
        </Button>
      </EmptyContent>
    </Empty>
  )
}
