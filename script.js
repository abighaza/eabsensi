// Konfigurasi URL Web App Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz8ahlEIloXEBAKgzZeEZHpWEHTnB4wIg2BEDfgPZPLnMkQmEybbn0vG3mgWONg5vbV/exec";

// Array penampung data lokal
let dataSiswaList = [];
let dataGuruList = [];
let currentUser = null;

// --- 1. FUNGSI LOGIN ---
function handleLogin(e) {
  if (e) e.preventDefault();
  const role = document.getElementById("login-role").value;
  const user = document.getElementById("login-user").value;

  currentUser = { role, user };
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("app-wrapper").classList.remove("hidden");
  document.getElementById("user-role-badge").innerText = role.toUpperCase();
  document.getElementById("current-username").innerText = user;

  if (role === "siswa") {
    const namaCard = document.getElementById("siswa-card-nama");
    const nisnCard = document.getElementById("siswa-card-nisn");

    const prosesDataSiswa = () => {
      const siswaData = dataSiswaList.find(
        (s) => String(s.nisn).trim() === String(user).trim()
      );

      if (siswaData) {
        if (namaCard) namaCard.innerText = siswaData.nama;
        if (nisnCard) nisnCard.innerText = "NISN: " + siswaData.nisn;
        document.getElementById("current-username").innerText = siswaData.nama;
      } else {
        if (namaCard) namaCard.innerText = "Siswa (" + user + ")";
        if (nisnCard) nisnCard.innerText = "NISN: " + user;
      }
    };

    if (dataSiswaList.length === 0) {
      if (namaCard) namaCard.innerText = "Memuat data...";
      fetch(`${WEB_APP_URL}?action=getSiswa`, { method: "GET", mode: "cors" })
        .then((res) => res.json())
        .then((data) => {
          dataSiswaList = data;
          prosesDataSiswa();
        })
        .catch(() => prosesDataSiswa());
    } else {
      prosesDataSiswa();
    }
  }

  setupNavigation(role);
}

function logout() {
  location.reload();
}

// --- 2. NAVIGASI ---
function setupNavigation(role) {
  const navLinks = document.getElementById("nav-links");
  navLinks.innerHTML = "";

  let menus = [];
  if (role === "admin") {
    menus = [
      { id: "dir-dashboard", name: "Dashboard", icon: "fa-chart-pie" },
      { id: "dir-data-siswa", name: "Data Siswa", icon: "fa-users" },
      { id: "dir-guru", name: "Data Guru", icon: "fa-chalkboard-user" },
      { id: "dir-laporan", name: "Laporan", icon: "fa-file-lines" },
      { id: "dir-kelola-absen", name: "Kelola Absen", icon: "fa-gear" },
      { id: "dir-scan-absen", name: "Scan Absen", icon: "fa-qrcode" },
    ];
  } else if (role === "guru") {
    menus = [
      { id: "dir-guru-monitoring", name: "Monitoring & Rekap", icon: "fa-clipboard-user" },
      { id: "dir-scan-absen", name: "Scan Barcode", icon: "fa-qrcode" },
    ];
  } else if (role === "siswa") {
    menus = [{ id: "dir-siswa-panel", name: "Portal Siswa", icon: "fa-user" }];
  }

  menus.forEach((menu, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="#" onclick="switchView('${menu.id}', this)"><i class="fa-solid ${menu.icon}"></i> ${menu.name}</a>`;
    if (index === 0) li.classList.add("active");
    navLinks.appendChild(li);
  });

  if (menus.length > 0) switchView(menus[0].id);
}

function switchView(viewId, element) {
  document.querySelectorAll(".view-section").forEach((sec) => sec.classList.add("hidden"));
  const target = document.getElementById(viewId);
  if (target) target.classList.remove("hidden");

  if (element) {
    document.querySelectorAll(".nav-menu li").forEach((li) => li.classList.remove("active"));
    element.parentElement.classList.add("active");
  }
}

// --- 3. JAM & TANGGAL REALTIME ---
setInterval(() => {
  const now = new Date();
  const clockEl = document.getElementById("live-clock");
  const dateEl = document.getElementById("live-date");
  if (clockEl) clockEl.innerText = now.toLocaleTimeString();
  if (dateEl) dateEl.innerText = now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}, 1000);

// --- 4. INISIALISASI HALAMAN & GRAFIK ---
window.addEventListener("DOMContentLoaded", () => {
  // Inisialisasi Chart.js Grafik Statistik
  const ctx = document.getElementById("attendanceChart");
  if (ctx) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Hadir", "Sakit", "Izin", "Alpa"],
        datasets: [
          {
            label: "# Statistik Kehadiran Minggu Ini",
            data: [120, 5, 2, 3],
            backgroundColor: ["#2ecc71", "#f1c40f", "#3498db", "#e74c3c"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  // Muat data server
  loadDataGuruDariServer();
  loadDataSiswaDariServer();
});

// --- 5. AMBIL DATA DARI SERVER ---
function loadDataSiswaDariServer() {
  fetch(`${WEB_APP_URL}?action=getSiswa`, { method: "GET", mode: "cors" })
    .then((res) => res.json())
    .then((data) => {
      dataSiswaList = data;
      const statTotal = document.getElementById("stat-total");
      if (statTotal) statTotal.innerText = data.length;
    })
    .catch((err) => console.error("Gagal load siswa:", err));
}

function loadDataGuruDariServer() {
  fetch(`${WEB_APP_URL}?action=getGuru`, { method: "GET", mode: "cors" })
    .then((res) => res.json())
    .then((data) => {
      dataGuruList = data;
    })
    .catch((err) => console.error("Gagal load guru:", err));
}

function refreshDashboard() {
  loadDataSiswaDariServer();
  loadDataGuruDariServer();
  alert("Data dashboard berhasil diperbarui!");
}
