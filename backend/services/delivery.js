// backend/services/delivery.js
const sgMail = require("@sendgrid/mail");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

if (!process.env.SENDGRID_API_KEY) {
  console.warn("⚠️ SENDGRID_API_KEY is not set in .env");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Resolve relative certificate path to absolute project path
function resolvePdfPath(pdfPath) {
  if (!pdfPath) return null;
  if (path.isAbsolute(pdfPath)) return pdfPath;
  // pdfPath is relative to project root (e.g. certificates/Name_certificate.pdf)
  return path.join(__dirname, "..", "..", pdfPath);
}

async function sendCertificateEmail(participant, pdfPath, eventDetails) {
  try {
    const absolutePath = resolvePdfPath(pdfPath);
    const fileExists = absolutePath && fs.existsSync(absolutePath);

    console.log("📤 Preparing email for:", participant.email);
    console.log("📁 Attachment (absolute):", absolutePath, "exists:", fileExists);

    if (!fileExists) {
      const errMsg = `Attachment not found: ${absolutePath}`;
      console.error("❌", errMsg);
      return { success: false, error: errMsg };
    }

    // Read file and convert to base64 for SendGrid attachment
    const fileBuffer = fs.readFileSync(absolutePath);
    const base64Content = fileBuffer.toString("base64");

    const msg = {
      to: participant.email,
      from: process.env.SENDGRID_FROM || process.env.SENDER_EMAIL,
      subject: `🎓 Certificate of Participation - ${participant.name}`,
      text: `Hello ${participant.name},\n\nPlease find attached your certificate for ${eventDetails.name}.\n\nRegards,\nEventEye Team`,
      html: `<p>Hello <strong>${participant.name}</strong>,</p>
             <p>Please find attached your certificate for <b>${eventDetails.name}</b> held on <b>${eventDetails.date}</b>.</p>
             <p>Regards,<br/>EventEye Team</p>`,
      attachments: [
        {
          content: base64Content,
          filename: `${participant.name.replace(/ /g, "_")}_certificate.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    };

    await sgMail.send(msg);
    console.log(`✅ Sent via SendGrid: ${participant.email}`);
    return { success: true };
  } catch (err) {
    // Print full error for debugging (SendGrid errors can be an object)
    console.error(`❌ SendGrid failed for ${participant.email}:`, err && err.response ? err.response.body : err);
    return { success: false, error: err };
  }
}

module.exports = { sendCertificateEmail };
