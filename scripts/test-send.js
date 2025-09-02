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
  const to = process.argv[2] || from;
  console.log("Sending to:", to);
  const transporter = nodemailer.createTransport(url);
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Test from Nodemailer via SendGrid",
      text: "Hello! This is a test message.",
    });
    console.log("Sent:", info && info.messageId, info && info.response);
  } catch (err) {
    console.error("sendMail error:", err && (err.response || err.message) || err);
    console.error(err && err.stack);
    process.exit(2);
  }
})();
