// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

// extra imports for certificates
const { generateCertificate } = require("./services/generator");
// import email delivery service
const { sendCertificateEmail } = require("./services/delivery");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // ✅ ensures Create Event JSON body works

// ensure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// multer config
const upload = multer({ dest: UPLOAD_DIR });

// in-memory store
let participants = [];
let certificateTokens = {}; // for QR verification

// store multiple events instead of overwriting
let events = {};
let currentEvent = null;

// health check
app.get("/", (req, res) => res.send("✅ Debug Backend Running"));

/* 
   --- Create Event ---
   Called by frontend (/api/events POST)
*/
app.post("/api/events", (req, res) => {
  const { name, date, organizer } = req.body;

  if (!name || !date || !organizer) {
    return res.status(400).json({ message: "❌ Missing event details" });
  }

  const newEvent = {
    id: Date.now().toString(), // unique ID
    name,
    date,
    organizer,
  };

  events[newEvent.id] = newEvent;
  currentEvent = newEvent.id; // set as active event

  console.log("🎉 Event created:", newEvent);

  res.json({
    message: "✅ Event created successfully!",
    event: newEvent,
  });
});

/* 
   Upload CSV route
*/
app.post("/api/events/:id/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const eventId = req.params.id;
  if (!events[eventId]) {
    return res.status(404).json({ message: "❌ Event not found" });
  }

  const results = [];
  const filePath = req.file.path;

  console.log(`📂 Upload received: ${req.file.originalname}`);

  fs.createReadStream(filePath)
    .pipe(
      csv({
        mapHeaders: ({ header }) => header.trim(),
        mapValues: ({ value }) => value.trim(),
      })
    )
    .on("data", (row) => {
      results.push({
        name: row.Name || row.name || "",
        email: row.Email || row.email || "",
        phone: row.Phone || row.phone || "",
        eventId,
        status: "pending",
      });
    })
    .on("end", () => {
      participants = participants.filter((p) => p.eventId !== eventId);
      participants = participants.concat(results);

      fs.unlinkSync(filePath); // delete temp file

      console.log(`✅ Parsed ${results.length} participants`);
      res.json({ message: "Participants updated!", count: results.length });
    })
    .on("error", (err) => {
      console.error("❌ CSV parse error:", err.message);
      res.status(500).json({ message: "CSV parse error", error: err.message });
    });
});

// view participants
app.get("/api/events/:id/participants", (req, res) => {
  const list = participants.filter((p) => p.eventId === req.params.id);
  res.json(list);
});

// --- Generate Certificates (with QR) ---
app.post("/api/events/:id/generate", async (req, res) => {
  const eventId = req.params.id;
  const eventParticipants = participants.filter((p) => p.eventId === eventId);
  const event = events[eventId];

  if (!event) {
    return res.status(404).json({ message: "❌ Event not found" });
  }
  if (eventParticipants.length === 0) {
    return res.status(400).json({ message: "❌ No participants found for this event" });
  }

  console.log(`⚡ Generating certificates for Event ${eventId}...`);

  let generated = [];

  try {
    for (const participant of eventParticipants) {
      console.log(`➡️ Generating for: ${participant.name}`);

      const { filePath, token } = await generateCertificate(participant, event);

      // save token for verification
      certificateTokens[token] = {
        name: participant.name,
        event: event.name,
        date: event.date,
        organizer: event.organizer,
      };

      generated.push({ participant: participant.name, filePath, verifyUrl: `/verify/${token}` });
    }

    console.log("✅ All certificates generated!");
    res.json({
      message: "Certificates generated successfully!",
      generated,
    });
  } catch (err) {
    console.error("❌ Error generating certificates:", err.message);
    res.status(500).json({ error: "Failed to generate certificates", details: err.message });
  }
});

// --- Verify Certificate by Token ---
app.get("/verify/:token", (req, res) => {
  const token = req.params.token;
  const cert = certificateTokens[token];

  if (!cert) {
    return res.status(404).send("<h1>❌ Invalid or expired certificate</h1>");
  }

  res.send(`
    <h1>✅ Certificate Verified</h1>
    <p><b>Name:</b> ${cert.name}</p>
    <p><b>Event:</b> ${cert.event}</p>
    <p><b>Date:</b> ${cert.date}</p>
    <p><b>Organizer:</b> ${cert.organizer}</p>
  `);
});

// --- Send Certificates by Email ---
app.post("/api/events/:id/send", async (req, res) => {
  const eventId = req.params.id;
  const eventParticipants = participants.filter((p) => p.eventId === eventId);
  const event = events[eventId];

  if (!event) {
    return res.status(404).json({ message: "❌ Event not found" });
  }
  if (eventParticipants.length === 0) {
    return res.status(400).json({ message: "❌ No participants found for this event" });
  }

  console.log(`📧 Sending certificates for Event ${eventId}...`);

  let results = [];

  for (const participant of eventParticipants) {
    const filePath = `certificates/${participant.name.replace(/ /g, "_")}_certificate.pdf`;

    console.log(`➡️ Sending to: ${participant.email} (file: ${filePath})`);

    const result = await sendCertificateEmail(participant, filePath, event);
    results.push({ email: participant.email, status: result.success ? "sent" : "failed" });
  }

  res.json({ message: "📧 Email sending complete", results });
});

// --- Dashboard Data ---
app.get("/api/events/:id/dashboard", (req, res) => {
  const eventId = req.params.id;
  const event = events[eventId];

  if (!event) {
    return res.status(404).json({ message: "❌ Event not found" });
  }

  const eventParticipants = participants.filter((p) => p.eventId === eventId);

  res.json({
    event,
    participants: eventParticipants,
  });
});

// Start server (always last)
app.listen(PORT, () =>
  console.log(`🚀 Debug server running http://localhost:${PORT}`)
);
