import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalContacts,
    newContacts,
    contactsThisWeek,
    totalCareers,
    pendingCareers,
    careersThisWeek,
    totalChats,
    chatsThisWeek,
    totalMessages,
    totalLeads,
    contactsByStatus,
    careersByStatus,
    contactsTrend,
    careersTrend,
    chatsTrend,
    recentContacts,
    recentCareers,
  ] = await Promise.all([
    prisma.contactSubmission.count(),
    prisma.contactSubmission.count({ where: { status: "NEW" } }),
    prisma.contactSubmission.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

    prisma.jobApplication.count(),
    prisma.jobApplication.count({ where: { status: "PENDING" } }),
    prisma.jobApplication.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

    prisma.chatThread.count(),
    prisma.chatThread.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.chatMessage.count(),
    prisma.chatLead.count(),

    prisma.contactSubmission.groupBy({ by: ["status"], _count: true }),
    prisma.jobApplication.groupBy({ by: ["status"], _count: true }),

    prisma.contactSubmission.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.jobApplication.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.chatThread.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    prisma.contactSubmission.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        budget: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.jobApplication.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        legalName: true,
        email: true,
        jobTitle: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  function buildDailyTrend(records: { createdAt: Date }[]) {
    const map: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      map[d.toISOString().split("T")[0]] = 0;
    }
    for (const r of records) {
      const key = r.createdAt.toISOString().split("T")[0];
      if (key in map) map[key]++;
    }
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }

  return NextResponse.json({
    contacts: {
      total: totalContacts,
      new: newContacts,
      thisWeek: contactsThisWeek,
      byStatus: contactsByStatus,
      trend: buildDailyTrend(contactsTrend),
      recent: recentContacts,
    },
    careers: {
      total: totalCareers,
      pending: pendingCareers,
      thisWeek: careersThisWeek,
      byStatus: careersByStatus,
      trend: buildDailyTrend(careersTrend),
      recent: recentCareers,
    },
    chats: {
      totalThreads: totalChats,
      totalMessages,
      thisWeek: chatsThisWeek,
      totalLeads,
      trend: buildDailyTrend(chatsTrend),
    },
  });
}
