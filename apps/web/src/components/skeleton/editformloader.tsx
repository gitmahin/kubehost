import Skeleton from "react-loading-skeleton"

export const EditFormLoader = () => {
    return <div className="mt-16 flex w-full items-center justify-center pb-20">
        <div className="w-full max-w-[500px] space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Basic Settings Fields */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" />
                </div>

                <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>

            <Skeleton className="h-px w-full" />

            {/* Visibility Section */}
            <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-80" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                </div>
            </div>

            <Skeleton className="h-px w-full" />

            {/* Env Vars Placeholder Box */}
            <div className="space-y-3">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-28 w-full rounded-lg" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    </div>
}