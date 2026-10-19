export interface BalancerImageOptions {
  prompt: string;
  width?: number;
  height?: number;
  model?: string;
  seed?: number;
  provider?: "auto" | "cloudflare" | "pollinations";
  signal?: AbortSignal;
  timeoutMs?: number;
  allowFailover?: boolean;
  cfAccountId?: string;
  cfApiToken?: string;
}

export interface BalancerImageResult {
  b64: string;
  mimeType: string;
  provider: "cloudflare" | "pollinations";
  model: string;
  width: number;
  height: number;
  failover: boolean;
  failoverReason?: string;
  durationMs: number;
}

export interface BalancerStatus {
  cloudflareConfigured: boolean;
  pollinationsAvailable: boolean;
  activeProviders: string[];
}

export function sanitizePrompt(prompt: string): string;
export function enhancePromptForFlux(prompt: string, style?: string): string;
export function isCloudflareConfigured(options?: BalancerImageOptions): boolean;
export function resolveCloudflareCredentials(options?: BalancerImageOptions): { accountId: string; token: string; ready: boolean };
export function saveCloudflareCredentials(creds: { accountId: string; token: string }): boolean;
export function getBalancerStatus(options?: BalancerImageOptions): BalancerStatus;
export function callCloudflareWorkersAI(options?: BalancerImageOptions): Promise<BalancerImageResult>;
export function callPollinationsAI(options?: BalancerImageOptions): Promise<BalancerImageResult>;
export function generateImageWithBalancer(options?: BalancerImageOptions): Promise<BalancerImageResult>;

