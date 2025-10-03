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
      alert(`✅ Event Created: ${data.event.name}`);
      console.log("Event Response:", data);
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

  if (fileInput.files.length === 0) {
    alert("Please select a CSV file first!");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  // For now we use Event ID = 1 (later we will dynamically use the created event ID)
  fetch("http://localhost:5000/api/events/1/upload", {
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
// Dashboard Navigation
// -----------------------------
function goToDashboard() {
  alert("Dashboard page will open (Step 9)");
  // Later we will link this to dashboard.html
}
