// -----------------------------
// Fake Dashboard Loader (Hardcoded)
// -----------------------------

// Hardcoded event details (pretend from backend)
const event = {
  id: "1759538416042",
  name: "Hackathon 2025",
  date: "2025-10-10",
  organizer: "EventEye Team",
};

// Hardcoded participants list (pretend uploaded & processed)
const participants = [
  { name: "Harshit Kumar", email: "kumarharshit370@gmail.com", status: "sent" },
  { name: "Rohit Sharma", email: "rohit@example.com", status: "failed" },
  { name: "Priya Singh", email: "priya@example.com", status: "pending" },
  { name: "Manroop Kaur", email: "manroop.jp22@gmail.com", status: "sent" },
  { name: "Roop", email: "manroopkaur2204@gmail.com", status: "sent" },
  { name: "Samridhi", email: "samridhimittu571@gmail.com", status: "sent" },
];

// Insert event details into HTML
document.getElementById("eventDetails").innerHTML = `
  <p><b>Name:</b> ${event.name}</p>
  <p><b>Date:</b> ${event.date}</p>
  <p><b>Organizer:</b> ${event.organizer}</p>
`;

// Insert participants into table
const tableBody = document.getElementById("participantList");
tableBody.innerHTML = "";
participants.forEach(p => {
  const row = `<tr>
    <td>${p.name}</td>
    <td>${p.email}</td>
    <td>${p.status}</td>
  </tr>`;
  tableBody.innerHTML += row;
});
