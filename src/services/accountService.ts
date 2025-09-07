import prisma from "@/db/client";

export const accountService = {
  async findCanvasAccount(userId: string) {
    return prisma.account.findFirst({ where: { userId, provider: "canvas" } });
  },
  async listCanvasAccounts() {
    return prisma.account.findMany({
      where: {
        provider: "canvas",
        access_token: { not: null },
        OR: [
          { expires_at: null }, // Tokens without expiration
          { expires_at: { gt: Math.floor(Date.now() / 1000) } } // Tokens that haven't expired
        ]
      },
      include: { user: true }
    });
  },
};


