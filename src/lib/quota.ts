import { prisma } from "./prisma";
import { QUOTA_COSTS, DAILY_QUOTA_LIMIT, QuotaStatus, QuotaHistoryItem } from "@/types/quota";

export async function trackQuotaUsage(
  userId: string,
  endpoint: string,
  multiplier: number = 1
): Promise<void> {
  const cost = (QUOTA_COSTS[endpoint] || 0) * multiplier;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.quotaHistory.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      consumedUnits: { increment: cost },
    },
    create: {
      userId,
      date: today,
      consumedUnits: cost,
      dailyLimit: DAILY_QUOTA_LIMIT,
    },
  });
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const quota = await prisma.quotaHistory.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  const consumedUnits = quota?.consumedUnits || 0;
  const dailyLimit = DAILY_QUOTA_LIMIT;

  return {
    date: today.toISOString(),
    consumedUnits,
    dailyLimit,
    remainingUnits: dailyLimit - consumedUnits,
    percentUsed: (consumedUnits / dailyLimit) * 100,
  };
}

export async function checkQuotaAvailable(
  userId: string,
  requiredUnits: number
): Promise<boolean> {
  const status = await getQuotaStatus(userId);
  return status.remainingUnits >= requiredUnits;
}

export async function getQuotaHistory(
  userId: string,
  days: number = 7
): Promise<QuotaHistoryItem[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const history = await prisma.quotaHistory.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return history.map((item) => ({
    date: item.date.toISOString(),
    consumedUnits: item.consumedUnits,
    dailyLimit: item.dailyLimit,
  }));
}

// Calculations moved to ./quota.shared.ts
