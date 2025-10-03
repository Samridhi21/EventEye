// backend/test-sendgrid.js
const sgMail = require("@sendgrid/mail");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function test() {
  try {
    console.log("🔑 Using FROM:", process.env.SENDGRID_FROM);
    const info = await sgMail.send({
      to: "kumarharshit370@gmail.com", // replace with your real test recipient
      from: process.env.SENDGRID_FROM,
      subject: "EventEye SendGrid test",
      text: "Hello — this is a SendGrid test from EventEye.",
    });
    console.log("✅ SendGrid send result:", info && info[0] && info[0].statusCode);
  } catch (err) {
    console.error("❌ SendGrid test failed:", err && err.response ? err.response.body : err);
  }
}
test();
