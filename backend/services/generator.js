const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const QRCode = require("qrcode");
const crypto = require("crypto");

// Replace placeholders in HTML template
function fillTemplate(template, data) {
  return template
    .replace(/{{name}}/g, data.name)
    .replace(/{{event}}/g, data.event)
    .replace(/{{date}}/g, data.date)
    .replace(/{{organizer}}/g, data.organizer)
    .replace(/{{qr_code}}/g, data.qr_code || "");
}

// Generate unique token for verification
function generateToken() {
  return crypto.randomBytes(8).toString("hex");
}

async function generateCertificate(participant, eventDetails) {
  const templatePath = path.join(__dirname, "../../templates/certificate.html");

  if (!fs.existsSync(templatePath)) {
    throw new Error("❌ Certificate template not found at " + templatePath);
  }

  let templateHtml = fs.readFileSync(templatePath, "utf-8");

  // Generate QR Code with verification link
  const token = generateToken();
  const verificationUrl = `http://localhost:5000/verify/${token}`;
  const qrCode = await QRCode.toDataURL(verificationUrl);

  // Fill placeholders in template
  const filledHtml = fillTemplate(templateHtml, {
    name: participant.name,
    event: eventDetails.name,
    date: eventDetails.date,
    organizer: eventDetails.organizer,
    qr_code: qrCode,
  });

  // Ensure certificates directory exists
  const outputDir = path.join(__dirname, "../../certificates");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Safe file name
  const safeName = participant.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = path.join(outputDir, `${safeName}_certificate.pdf`);

    // Puppeteer: render PDF
  const browser = await puppeteer.launch({
    headless: true, // always headless
    executablePath: puppeteer.executablePath(), // ✅ use built-in Chromium
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--single-process",
      "--no-zygote"
    ],
  });



  const page = await browser.newPage();
  await page.setContent(filledHtml, { waitUntil: "networkidle0" });
console.log("🖨 Rendering PDF for:", participant.name);

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return { filePath, token };
}

module.exports = { generateCertificate };
