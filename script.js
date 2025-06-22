// === EmailJS Initialization ===
emailjs.init("YKQ-XA7D55lvUMzvF"); // Replace with your EmailJS user ID

// === Firebase Initialization ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase, ref, set, get, remove, onValue
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDroX5R2fkfs76mjQXmHQ2ZAz9zTbVg90",
  authDomain: "slot-book-8a1b9.firebaseapp.com",
  databaseURL: "https://slot-book-8a1b9-default-rtdb.firebaseio.com",
  projectId: "slot-book-8a1b9",
  storageBucket: "slot-book-8a1b9.firebasestorage.app",
  messagingSenderId: "162338367561",
  appId: "1:162338367561:web:03d1eefdd2940a19a97798"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const bookingsRef = ref(db, "bookings");
const slotContainer = document.getElementById("slotContainer");
const alertBox = document.getElementById("alertBox");

let totalSlots = 30;
let selectedSlot = null;
const bookedSlots = [];

// === Utility ===
function showAlert(message) {
  alertBox.innerText = message;
  alertBox.style.display = "block";
  setTimeout(() => {
    alertBox.style.display = "none";
  }, 3000);
}

// === Slot Initialization ===
for (let i = 1; i <= totalSlots; i++) {
  createSlotButton(i);
}

function createSlotButton(slotNum) {
  const btn = document.createElement("button");
  btn.innerText = slotNum;
  btn.classList.add("slot-btn");
  btn.dataset.slot = slotNum;
  btn.onclick = () => {
    if (btn.classList.contains("booked")) return;
    document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
    selectedSlot = parseInt(btn.dataset.slot);
    btn.classList.add("selected");
  };
  slotContainer.appendChild(btn);
}

// === Load Existing Bookings ===
get(bookingsRef).then(snapshot => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    Object.entries(data).forEach(([key, booking]) => {
      const slot = parseInt(key.replace("slot", ""));
      bookedSlots.push(slot);
      const btn = document.querySelector(`.slot-btn[data-slot="${slot}"]`);
      if (btn) {
        btn.classList.add("booked");
        btn.disabled = true;
      }
    });
  }
});

// === Load Public Image ===
get(ref(db, "public/image")).then(snapshot => {
  if (snapshot.exists()) {
    document.getElementById("publicImageDisplay").innerHTML = `
      <img src="${snapshot.val()}" style="max-width:100%; border-radius:10px;" alt="Public Image" />
    `;
  }
});

// === Admin Login ===
window.adminLogin = () => {
  const input = document.getElementById("adminPassInput").value.trim();
  const passRef = ref(db, "admin/password");
  get(passRef).then(snapshot => {
    if (snapshot.exists() && input === snapshot.val()) {
      document.getElementById("adminControls").style.display = "block";
      document.getElementById("publicButtons").style.display = "none";
      document.getElementById("adminLoginSection").style.display = "none";
      document.getElementById("adminImageUpload").style.display = "block";
      showAlert("✅ Admin login successful!");
    } else {
      showAlert("❌ Incorrect admin password.");
    }
  });
};

window.adminLogout = () => {
  document.getElementById("adminControls").style.display = "none";
  document.getElementById("publicButtons").style.display = "flex";
  document.getElementById("adminLoginSection").style.display = "block";
  document.getElementById("adminPassInput").value = "";
  document.getElementById("adminImageUpload").style.display = "none";
  showAlert("🚪 Logged out.");
};

window.closeAdminLogin = () => {
  document.getElementById("adminLoginSection").style.display = "none";
};

window.toggleAdminLogin = () => {
  const section = document.getElementById("adminLoginSection");
  section.style.display = (section.style.display === "none") ? "block" : "none";
  showAlert("🔐 Enter the admin password to log in");
};

// === Booking Submission ===
window.submitBooking = () => {
  const name = document.getElementById("vtcName").value.trim();
  const role = document.getElementById("vtcRole").value.trim();
  const link = document.getElementById("vtcLink").value.trim();
  const discord = document.getElementById("discordId").value.trim();

  if (!name || !role || !link || !discord || !selectedSlot) {
    showAlert("Please fill all fields and select a slot.");
    return;
  }

  if (!/^https:\/\/truckersmp\.com\/vtc\/(\d+)?$/.test(link)) {
    showAlert("❌ Invalid VTC link! Must be https://truckersmp.com/vtc/ or include an ID.");
    return;
  }

  if (!/^@/.test(discord)) {
    showAlert("❌ Invalid Discord ID. It must start with '@(username)'.");
    return;
  }

  const bookingData = {
    vtcName: name,
    vtcRole: role,
    vtcLink: link,
    discordId: discord,
    slotNumber: selectedSlot,
    timestamp: new Date().toISOString()
  };

  const slotRef = ref(db, "bookings/slot" + selectedSlot);
  set(slotRef, bookingData).then(() => {
    bookedSlots.push(selectedSlot);
    const btn = document.querySelector(`.slot-btn[data-slot="${selectedSlot}"]`);
    btn.classList.remove("selected");
    btn.classList.add("booked");
    btn.disabled = true;

    document.getElementById("popupGrid").innerHTML = `
      <div>🆔 Slot:</div><div>${bookingData.slotNumber}</div>
      <div>🚛 VTC:</div><div>${bookingData.vtcName}</div>
      <div>🎖️ Role:</div><div>${bookingData.vtcRole}</div>
      <div>🔗 Link:</div><div><a href="${bookingData.vtcLink}" target="_blank">${bookingData.vtcLink}</a></div>
      <div>💬 Discord ID:</div><div>${bookingData.discordId}</div>
    `;
    document.getElementById("bookingSuccessPopup").style.display = "flex";

    // Discord Webhook
    fetch("https://discord.com/api/webhooks/1386354144863981638/Y83UUBRIJyURXUuiRvEifdNSYzUcxpUIbeMM0fQLu1L3OCG9IG0wTKmt5kU3Xui_xO38", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "<@&715583272062681110> A new VTC slot has been booked!",
        embeds: [{
          title: `✅ VTC Slot Booked: Slot ${bookingData.slotNumber}`,
          description: `🚛 **VTC Name:** ${bookingData.vtcName}\n🎖️ **Role:** ${bookingData.vtcRole}\n🔗 **Link:** ${bookingData.vtcLink}\n🆔 **Discord ID:** ${bookingData.discordId}`,
          color: 16711680,
          image: { url: "https://i.imgur.com/Vt6UaZn.gif" },
          timestamp: new Date().toISOString()
        }]
      })
    });

  }).catch(() => {
    showAlert("Error booking. Try again.");
  });
};

// === Other Functions ===
document.getElementById("clearForm").addEventListener("click", () => {
  ["vtcName", "vtcRole", "vtcLink", "discordId"].forEach(id => document.getElementById(id).value = "");
  document.querySelectorAll(".slot-btn").forEach(btn => btn.classList.remove("selected"));
  selectedSlot = null;
});

window.resetAllSlots = () => {
  if (!confirm("Are you sure you want to reset all slots?")) return;
  remove(bookingsRef).then(() => {
    bookedSlots.length = 0;
    document.querySelectorAll(".slot-btn").forEach(btn => {
      btn.classList.remove("booked", "selected");
      btn.disabled = false;
    });
    showAlert("All slots have been reset!");
  });
};

window.addSlot = () => {
  totalSlots++;
  const name = document.getElementById("customSlotName").value.trim() || totalSlots;
  createSlotButton(totalSlots);
  document.querySelector(`.slot-btn[data-slot="${totalSlots}"]`).innerText = name;
  document.getElementById("customSlotName").value = "";
};

window.deleteSelectedSlot = () => {
  if (!selectedSlot) return showAlert("❌ No slot selected.");
  const btn = document.querySelector(`.slot-btn[data-slot="${selectedSlot}"]`);
  if (btn && !btn.classList.contains("booked")) {
    btn.remove();
    selectedSlot = null;
    showAlert("✅ Slot removed.");
  } else {
    showAlert("❌ Cannot delete a booked slot.");
  }
};

window.renameSelectedSlot = () => {
  const newName = document.getElementById("renameSlotInput").value.trim();
  if (!selectedSlot || !newName) return showAlert("❗ Select a slot and enter a name.");
  const btn = document.querySelector(`.slot-btn[data-slot="${selectedSlot}"]`);
  if (btn) {
    btn.innerText = newName;
    showAlert(`✅ Slot renamed to "${newName}"`);
  }
};

window.deleteLastSlot = () => {
  const lastBtn = document.querySelector(`.slot-btn[data-slot="${totalSlots}"]`);
  if (lastBtn && !lastBtn.classList.contains("booked")) {
    lastBtn.remove();
    totalSlots--;
    showAlert("✅ Last slot removed.");
  } else {
    showAlert("❌ Cannot delete last slot.");
  }
};

window.toggleViewPanel = () => {
  const panel = document.getElementById("bookingPanel");
  const list = document.getElementById("bookingList");
  if (panel.style.display === "none") {
    panel.style.display = "block";
    list.innerHTML = "<p>Loading...</p>";
    get(bookingsRef).then(snapshot => {
      if (!snapshot.exists()) return list.innerHTML = "<p>No bookings found.</p>";
      const data = snapshot.val();
      list.innerHTML = "<ul>" + Object.values(data).map(b =>
        `<li><strong>Slot ${b.slotNumber}</strong> — ${b.vtcName}<hr></li>`
      ).join("") + "</ul>";
    });
  } else {
    panel.style.display = "none";
  }
};

window.handleFileOption = (type) => {
  if (type === "email") {
    document.getElementById("emailPrompt").style.display = "block";
  } else {
    const content = `Your VTC Booking:\nSlot: ${selectedSlot}\nVTC: ${document.getElementById("vtcName").value}`;
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `VTC_Slot_${Math.floor(Math.random()*10000)}.txt`;
    link.click();
  }
};

window.sendEmailToUser = () => {
  const email = document.getElementById("userEmailInput").value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return alert("❌ Please enter a valid email address.");
  }

  const templateParams = {
    email,
    slot: selectedSlot,
    vtc: document.getElementById("vtcName").value,
    role: document.getElementById("vtcRole").value,
    link: document.getElementById("vtcLink").value,
    discord: document.getElementById("discordId").value
  };

  emailjs.send("service_0yqz9cj", "template_tazt67g", templateParams)
    .then(() => {
      showAlert("✅ Email sent successfully!");
      document.getElementById("emailPrompt").style.display = "none";
      document.getElementById("userEmailInput").value = "";
    }).catch(() => {
      showAlert("❌ Failed to send email.");
    });
};

window.closePopup = () => {
  document.getElementById("bookingSuccessPopup").style.display = "none";
};

window.submitImageLink = () => {
  const url = document.getElementById("imageUrlInput").value.trim();
  if (!url || !url.match(/\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i)) {
    return showAlert("❌ Please enter a valid image URL.");
  }

  document.getElementById("imagePreviewContainer").innerHTML =
    `<img src="${url}" class="uploaded-image" alt="Uploaded Image" />`;

  document.getElementById("publicImageDisplay").innerHTML =
    `<img src="${url}" style="max-width:100%; border-radius:10px;" alt="Public Image" />`;

  set(ref(db, "public/image"), url)
    .then(() => showAlert("✅ Image URL saved successfully!"))
    .catch(() => showAlert("❌ Failed to save image URL."));
};