import prisma from "@/db/client";

export const accountService = {
  async findCanvasAccount(userId: string) {
    return prisma.account.findFirst({ where: { userId, provider: "canvas" } });
  },
  async listCanvasAccounts() {
    return prisma.account.findMany({ where: { provider: "canvas", access_token: { not: null } }, include: { user: true } });
  },
};


