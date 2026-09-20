export type DeploymentDashboard = {
  deployment: {
    name?: string
    namespace?: string
    image?: string
    containerPort?: number
    replicas: {
      desired: number
      ready: number
      available: number
      updated: number
    }
    createdAt?: Date
  }

  service?: {
    name?: string
    type?: string
    clusterIP?: string
    ports: Array<{
      port?: number
      targetPort?: number | string
      protocol?: string
    }>
  }

  ingress: Array<{
    name?: string
    host?: string
    path?: string
    pathType?: string
  }>

  pods: Array<{
    name?: string
    status?: string
    podIP?: string
    nodeName?: string
    restarts: number
    createdAt?: Date
  }>
}
