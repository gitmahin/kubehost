export function parseCpuToNano(cpu: string): number {
    if (cpu.endsWith("n")) {
      return Number(cpu.slice(0, -1))
    }

    if (cpu.endsWith("u")) {
      return Number(cpu.slice(0, -1)) * 1_000
    }

    if (cpu.endsWith("m")) {
      return Number(cpu.slice(0, -1)) * 1_000_000
    }

    return Number(cpu) * 1_000_000_000
  }