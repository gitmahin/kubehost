export function cpuToCore(cpu: string | number): number {
  if (typeof cpu === "number") {
    return cpu
  }

  const value = parseFloat(cpu)

  if (cpu.toLowerCase().endsWith("m")) {
    return value / 1000
  }

  return value
}

export function memoryToHumanRead(memory: string | number): string {
  const value = typeof memory === "number" ? memory : parseFloat(memory)

  const input = String(memory).trim().toLowerCase()

  let bytes: number

  if (input.endsWith("ki")) {
    bytes = value * 1024
  } else if (input.endsWith("mi")) {
    bytes = value * 1024 ** 2
  } else if (input.endsWith("gi")) {
    bytes = value * 1024 ** 3
  } else if (input.endsWith("ti")) {
    bytes = value * 1024 ** 4
  } else if (input.endsWith("kb")) {
    bytes = value * 1000
  } else if (input.endsWith("mb")) {
    bytes = value * 1000 ** 2
  } else if (input.endsWith("gb")) {
    bytes = value * 1000 ** 3
  } else if (input.endsWith("tb")) {
    bytes = value * 1000 ** 4
  } else {
    bytes = value
  }

  const gb = bytes / 1000 ** 3
  const mb = bytes / 1000 ** 2
  const tb = bytes / 1000 ** 4

  if (tb >= 1) {
    return `${Number(tb.toFixed(2))} TB`
  }

  if (gb >= 1) {
    return `${Number(gb.toFixed(2))} GB`
  }

  return `${Number(mb.toFixed(2))} MB`
}
