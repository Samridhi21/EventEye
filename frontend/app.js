// -----------------------------
// Global State
// -----------------------------
let currentEventId = null; // store the event ID after creation

// -----------------------------
// Event Creation Form Handling
// -----------------------------
document.getElementById("event-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("eventName").value;
  const date = document.getElementById("eventDate").value;
  const organizer = document.getElementById("organizerName").value;

  // Send event details to backend
  fetch("http://localhost:5000/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, date, organizer }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.event) {
        currentEventId = data.event.id; // ✅ save event ID
        alert(`✅ Event Created: ${data.event.name} (ID: ${currentEventId})`);
        console.log("Event Response:", data);
      } else {
        alert("❌ Failed to create event!");
      }
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("❌ Failed to create event!");
    });
});

// -----------------------------
// CSV Upload Handling
// -----------------------------
document.getElementById("uploadBtn").addEventListener("click", function () {
  const fileInput = document.getElementById("csvUpload");

  if (!currentEventId) {
    alert("❌ Please create an event first!");
    return;
  }
  if (fileInput.files.length === 0) {
    alert("Please select a CSV file first!");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  fetch(`http://localhost:5000/api/events/${currentEventId}/upload`, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      alert(`✅ Uploaded ${data.count} participants successfully!`);
      console.log("Upload Response:", data);
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("❌ Upload failed!");
    });
});

// -----------------------------
// Generate Certificates Handling
// -----------------------------
document.getElementById("generateBtn").addEventListener("click", function () {
  if (!currentEventId) {
    alert("❌ Please create an event first!");
    return;
  }

  fetch(`http://localhost:5000/api/events/${currentEventId}/generate`, {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => {
      alert("✅ Certificates generated!");
      console.log("Generate Response:", data);
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("❌ Failed to generate certificates!");
    });
});

// -----------------------------
// Send Certificates Handling
// -----------------------------
document.getElementById("sendBtn").addEventListener("click", function () {
  if (!currentEventId) {
    alert("❌ Please create an event first!");
    return;
  }

  fetch(`http://localhost:5000/api/events/${currentEventId}/send`, {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => {
      alert("📧 Email sending process finished!");
      console.log("Send Response:", data);
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("❌ Failed to send emails!");
    });
});

// -----------------------------
// Dashboard Navigation
// -----------------------------
function goToDashboard() {
  if (!currentEventId) {
    alert("❌ Please create an event first!");
    return;
  }

  // Save eventId in localStorage so dashboard.html can use it
  localStorage.setItem("currentEventId", currentEventId);

  // Redirect to dashboard.html
  window.location.href = "dashboard.html";
}
