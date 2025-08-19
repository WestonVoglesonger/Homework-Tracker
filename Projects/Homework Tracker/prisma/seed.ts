import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@example.com";
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: "Demo User" },
    update: {},
  });

  const course = await prisma.course.upsert({
    where: { userId_canvasId: { userId: user.id, canvasId: "seed-course" } },
    update: {},
    create: {
      userId: user.id,
      name: "Sample Course",
      code: "COMP 101",
      term: "Fall",
      color: "#4f46e5",
      source: "manual",
      canvasId: "seed-course",
    },
  });

  const titles = ["Homework 1", "Quiz 1", "Project 1"];
  for (const [i, title] of titles.entries()) {
    await prisma.assignment.upsert({
      where: { userId_canvasId: { userId: user.id, canvasId: `seed-assignment-${i}` } },
      update: {},
      create: {
        userId: user.id,
        courseId: course.id,
        title,
        type: i === 1 ? "QUIZ" : i === 2 ? "PROJECT" : "HOMEWORK",
        status: i === 0 ? "TODO" : i === 1 ? "IN_PROGRESS" : "DONE",
        priority: i % 3,
        canvasId: `seed-assignment-${i}`,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


