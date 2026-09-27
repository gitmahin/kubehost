import type { SystemMemory } from "@repo/types"
import os from "node:os"
 
 export const getSystemMemory = () => {

     const totalMemBytes = os.totalmem()
     const freeMemBytes = os.freemem()
     const usedMemBytes = totalMemBytes - freeMemBytes
     
     const systemMemory: SystemMemory = {
         totalBytes: totalMemBytes,
         freeBytes: freeMemBytes,
         usedBytes: usedMemBytes,
         totalGB: +(totalMemBytes / 1024 ** 3).toFixed(2),
         freeGB: +(freeMemBytes / 1024 ** 3).toFixed(2),
         usedGB: +(usedMemBytes / 1024 ** 3).toFixed(2),
         usedPercent: +((usedMemBytes / totalMemBytes) * 100).toFixed(2),
        }

        return systemMemory
    }