import type { MetricsResponse } from "@repo/types"

type Option = { label: string; value: string }

// trims trailing zeros: 1.50 -> "1.5", 2.00 -> "2"
const fmt = (n: number) => `${+n.toFixed(2)}`

export function getCpuOptions(metrics: MetricsResponse | null): Option[] {
  const totalCores = metrics?.cpu?.cores ?? 0
  if (!totalCores) return []

  // fixed presets, only those below the system max are kept
  const presets = [0.15, 0.25, 0.5, 1, 1.15, 1.25, 1.5, 2, 2.5]

  // then whole cores: 3, 4, 5 ... up to max - 1
  const wholeCores: number[] = []
  for (let c = 3; c < totalCores; c++) wholeCores.push(c)

  const values = [...presets, ...wholeCores]
    .filter((v) => v < totalCores)
    .sort((a, b) => a - b)

  const options: Option[] = values.map((v) => ({
    label: `${fmt(v)} ${v === 1 ? "Core" : "Cores"}`,
    value: fmt(v),
  }))

  options.push({
    label: `${fmt(totalCores)} ${totalCores === 1 ? "Core" : "Cores"} (System Max)`,
    value: fmt(totalCores),
  })

  return options
}

export function getMemoryOptions(metrics: MetricsResponse | null): Option[] {
  const totalGB = metrics?.memory?.system?.totalGB ?? 0
  if (!totalGB) return []

  const STEP_GB = 0.5
  const totalMB = Math.round(totalGB * 1024)

  // small presets first, then 1 GB and up in 0.5 GB steps
  const mbValues: number[] = [250, 512].filter((mb) => mb < totalMB)
  for (let gb = 1; gb * 1024 < totalMB; gb += STEP_GB) {
    mbValues.push(Math.round(gb * 1024))
  }

  const options: Option[] = mbValues.map((mb) => {
    if (mb < 1024) return { label: `${mb} MB`, value: `${mb}MB` }
    const g = fmt(mb / 1024)
    return { label: `${g} GB`, value: `${g}GB` }
  })

  const maxG = totalGB.toFixed(2)
  options.push({ label: `${maxG} GB (System Max)`, value: `${maxG}GB` })

  return options
}
