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


export interface ResourceMetric {
  usage: string | null
  limit: string | null
  utilization: number | null
}

export interface ContainerMetrics {
  name: string
  cpu: ResourceMetric
  memory: ResourceMetric
}

export interface PodMetrics {
  name: string | undefined
  containers: ContainerMetrics[]
}

export interface DeploymentMetrics {
  pods: PodMetrics[]
  totalCpuMillicores: number
  totalMemoryBytes: number
  totalMemoryMiB: number
}

export type DeploymentInfo = {
  name?: string;
  namespace?: string;

  image: {
    name?: string;
    pullPolicy?: string;
  };

  container: {
    name?: string;
    port?: number;
    command?: string[];
    args?: string[];
    workingDir?: string;
  };

  resources: {
    requests?: Record<string, string>;
    limits?: Record<string, string>;
  };

  replicas: {
    desired: number;
    ready: number;
    available: number;
    updated: number;
  };

  status: "Running" | "Not Ready";

  statusMessage?: string;

  createdAt?: Date;

  labels?: Record<string, string>;
};