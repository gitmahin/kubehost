import os from "node:os"

export const getCpuCores = () => {
    return os.cpus().length
}