export function parseMemoryToBytes(memory: string): number {
  const value = parseFloat(memory)

  if (memory.endsWith("Ki")) {
    return value * 1024
  }

  if (memory.endsWith("Mi")) {
    return value * 1024 * 1024
  }

  if (memory.endsWith("Gi")) {
    return value * 1024 * 1024 * 1024
  }

  if (memory.endsWith("Ti")) {
    return value * 1024 * 1024 * 1024 * 1024
  }

  if (memory.endsWith("K")) {
    return value * 1000
  }

  if (memory.endsWith("M")) {
    return value * 1000 * 1000
  }

  if (memory.endsWith("G")) {
    return value * 1000 * 1000 * 1000
  }

  // Bytes
  return value
}
