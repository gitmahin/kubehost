import { Sidebar, Header } from "@/components"
import { metricsStore } from "@/stores"
import { getClientEnv } from "@/utils/env"
import { KubehostService } from "@repo/services"
import type { MetricsResponse } from "@repo/types"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/_pathlessMain")({
  component: RouteComponent,
})

function RouteComponent() {
  const kubehostService = new KubehostService(
    getClientEnv("VITE_API_SERVER_URL")
  )

  const {
    data: metrics,
    isLoading,
    isError,
    error,
  } = useQuery<MetricsResponse>({
    queryKey: ["kubehost-metrics"],
    queryFn: async () => {
      const res: any = await kubehostService.getMetricsDashboard()
      return res?.data?.data ?? res?.data ?? res
    },
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    metricsStore.setIsLoading(isLoading)

    if (isError) {
      metricsStore.setError(
        true,
        (error as any)?.message || "Failed to fetch system metrics"
      )
    } else if (metrics) {
      metricsStore.setMetrics(metrics)
    }
  }, [isLoading, isError, error, metrics])

  return (
    <div className="flex items-start justify-start">
      <Sidebar />
      <div className="w-full">
        <Header />
        <Outlet />
      </div>
    </div>
  )
}
