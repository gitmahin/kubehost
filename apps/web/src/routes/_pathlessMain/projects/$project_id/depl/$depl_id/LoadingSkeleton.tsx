import { Card, CardContent, CardHeader } from "@workspace/ui/components"
import Skeleton from "react-loading-skeleton"

export const LoadingSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton
            width={180}
            height={28}
            baseColor="#27272a"
            highlightColor="#3f3f46"
          />
          <Skeleton
            width={120}
            height={16}
            baseColor="#27272a"
            highlightColor="#3f3f46"
          />
        </div>
        <div className="flex gap-2">
          <Skeleton
            width={80}
            height={36}
            borderRadius={6}
            baseColor="#27272a"
            highlightColor="#3f3f46"
          />
          <Skeleton
            width={80}
            height={36}
            borderRadius={6}
            baseColor="#27272a"
            highlightColor="#3f3f46"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-zinc-800 bg-zinc-900/40">
            <CardHeader className="p-4">
              <Skeleton
                width={120}
                height={16}
                baseColor="#27272a"
                highlightColor="#3f3f46"
              />
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              <Skeleton
                width={160}
                height={24}
                baseColor="#27272a"
                highlightColor="#3f3f46"
              />
              <Skeleton
                width={200}
                height={14}
                baseColor="#27272a"
                highlightColor="#3f3f46"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
