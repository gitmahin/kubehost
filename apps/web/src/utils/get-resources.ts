import type { MetricsResponse } from "@repo/types"

export function getMemoryOptions(metrics: MetricsResponse | null) {
  const totalGB = metrics?.memory?.system?.totalGB ?? 0
  if (!totalGB) return []

  const MIN_MB = 512
  const totalMB = totalGB * 1024

  const fractions = [0, 0.125, 0.25, 0.5, 0.75, 1]

  const options: { label: string; value: string }[] = []
  const seen = new Set<number>()

  fractions.forEach((fraction) => {
    const isMax = fraction === 1

    const calculatedMB = isMax
      ? Math.round(totalMB)
      : Math.max(
          MIN_MB,
          fraction === 0 ? MIN_MB : Math.round(totalMB * fraction)
        )

    if (seen.has(calculatedMB)) return
    seen.add(calculatedMB)

    const calculatedGB = calculatedMB / 1024
    const isMB = calculatedMB < 1024

    const label = isMax
      ? `${totalGB.toFixed(2)} GB (System Max)`
      : isMB
        ? `${calculatedMB} MB`
        : `${calculatedGB.toFixed(2)} GB`

    const value = isMB ? `${calculatedMB}MB` : `${calculatedGB.toFixed(2)}GB`

    options.push({ label, value })
  })

  return options
}

export function getCpuOptions(metrics: MetricsResponse | null) {
  const totalCores = metrics?.cpu?.cores ?? 0
  if (!totalCores) return []

  const MIN_CPU = 0.25

  const fractions = [0, 0.25, 0.5, 0.75, 1]

  const options: { label: string; value: string }[] = []

  fractions.forEach((fraction) => {
    const coreVal =
      fraction === 0 ? MIN_CPU : +(totalCores * fraction).toFixed(2)

    if (coreVal < MIN_CPU) return

    const isMax = fraction === 1
    const label = isMax
      ? `${totalCores} Cores (System Max)`
      : `${coreVal} ${coreVal === 1 ? "Core" : "Cores"}`

    options.push({
      label,
      value: `${coreVal}`,
    })
  })

  return options.filter(
    (opt, index, self) => index === self.findIndex((t) => t.value === opt.value)
  )
}
