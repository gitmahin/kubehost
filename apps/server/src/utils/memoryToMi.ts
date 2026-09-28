export function memoryToMi(memory: string | number): string {
  if (typeof memory === "number") {
    return `${memory}Mi`
  }

  const value = parseFloat(memory)
  const unit = memory
    .trim()
    .toLowerCase()
    .replace(/[0-9.\s]/g, "")

  switch (unit) {
    case "b":
      return `${Math.round(value / (1024 * 1024))}Mi`

    case "kb":
      return `${Math.round((value * 1000) / (1024 * 1024))}Mi`

    case "kib":
      return `${Math.round(value / 1024)}Mi`

    case "mb":
      return `${Math.round((value * 1000 * 1000) / (1024 * 1024))}Mi`

    case "mib":
      return `${Math.round(value)}Mi`

    case "gb":
      return `${Math.round(
        (value * 1000 * 1000 * 1000) / (1024 * 1024)
      )}Mi`

    case "gib":
      return `${Math.round(value * 1024)}Mi`

    case "tb":
      return `${Math.round(
        (value * 1000 * 1000 * 1000 * 1000) /
          (1024 * 1024)
      )}Mi`

    case "tib":
      return `${Math.round(value * 1024 * 1024)}Mi`

    default:
      throw new Error(`Unsupported memory unit: ${memory}`)
  }
}