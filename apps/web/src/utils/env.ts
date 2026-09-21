declare global {
  interface Window {
    __ENV__?: {
      VITE_API_SERVER_URL: string
    }
  }
}

export function getClientEnv(key: string) {
  // Check runtime window injection first (Production Docker)
  if (
    typeof window !== "undefined" &&
    window.__ENV__?.[key as keyof typeof window.__ENV__]
  ) {
    return window.__ENV__[key as keyof typeof window.__ENV__]
  }
  // Fall back to Vite's build-time env vars (Local Dev)
  return import.meta.env[key]
}
