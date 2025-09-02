const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

function loadDotenv(file) {
  const envPath = path.resolve(file);
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
    map[key] = val;
  }
  return map;
}

(async () => {
  const env = loadDotenv(".env.local");
  const url = env.EMAIL_SERVER;
  const from = env.EMAIL_FROM;
  if (!url || !from) {
    console.error("Missing EMAIL_SERVER or EMAIL_FROM in .env.local");
    process.exit(1);
  }
  console.log("From:", from);
  console.log("Server:", url.replace(/(apikey:)[^@]+/, "$1***REDACTED***"));

  const transporter = nodemailer.createTransport(url);
  try {
    const ok = await transporter.verify();
    console.log("SMTP verify success:", ok);
  } catch (err) {
    console.error("SMTP verify failed:", err && (err.response || err.message) || err);
    console.error(err && err.stack);
    process.exit(2);
  }
})();
