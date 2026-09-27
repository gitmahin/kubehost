import Skeleton from "react-loading-skeleton"

export const MetricsDashLoader = () => {
    return <div className="mx-auto max-w-7xl flex-1 space-y-6 p-6 md:p-8">
        <div className="flex items-center justify-between border-b pb-6">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-6 w-[100px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
        </div>
    </div>
}