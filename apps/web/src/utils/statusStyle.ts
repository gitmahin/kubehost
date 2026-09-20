const statusStyles: Record<string, string> = {
  Running: "border-green-600/40 text-green-500 bg-green-500/10",
  Progressing: "border-blue-600/40 text-blue-500 bg-blue-500/10",
  Pending: "border-yellow-600/40 text-yellow-500 bg-yellow-500/10",
  "Not Ready": "border-yellow-600/40 text-yellow-500 bg-yellow-500/10",
  Degraded: "border-orange-600/40 text-orange-500 bg-orange-500/10",
  Failed: "border-red-600/40 text-red-500 bg-red-500/10",
  CrashLoopBackOff: "border-red-600/40 text-red-500 bg-red-500/10",
  Paused: "border-zinc-600/40 text-zinc-400 bg-zinc-500/10",
  "Scaled to zero": "border-zinc-600/40 text-zinc-400 bg-zinc-500/10",
  Unknown: "border-zinc-600/40 text-zinc-400 bg-zinc-500/10",
}

export function getStatusStyle(status?: string) {
  return statusStyles[status ?? "Unknown"] ?? statusStyles.Unknown
}
