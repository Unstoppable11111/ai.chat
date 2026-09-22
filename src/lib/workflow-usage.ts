import { takeQuota } from './server-security';

const limits = { novel: 2, asset: 10, tune: 20 } as const;

// Accepted upstream attempts are independent of editable bookshelf data.
export async function reserveWorkflowUsage(userId: string, kind: keyof typeof limits, isAdmin: boolean): Promise<boolean> {
  if (!userId) return false;
  if (isAdmin) return true;
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
  return takeQuota(`workflow:usage:${kind}:${userId}:${day}`, limits[kind], 48 * 60 * 60 * 1000);
}
