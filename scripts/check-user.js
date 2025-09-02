const fs = require("fs");
const path = require("path");
function loadDotenv(file) {
  const envPath = path.resolve(file);
  if (!fs.existsSync(envPath)) return {};
  const text = fs.readFileSync(envPath, "utf8");
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith(") && val.endsWith("))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
loadDotenv(".env.local");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  const email = process.argv[2];
  if (!email) { console.error("Usage: node check-user.js <email>"); process.exit(1); }
  const user = await prisma.user.findUnique({ where: { email } });
  console.log(user ? { id: user.id, email: user.email, name: user.name } : null);
  await prisma.$disconnect();
})();
