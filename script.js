// Konfigurasi URL Web App Google Apps Script Anda
const WEB_APP_URL = "MASUKKAN_URL_WEB_APP_ANDA_DISINI";

// Navigasi & Role Management
let currentUser = null;

function handleLogin(e) {
  e.preventDefault();
  const role = document.getElementById("login-role").value;
  const user = document.getElementById("login-user").value;

  currentUser = { role, user };
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("app-wrapper").classList.remove("hidden");
  document.getElementById("user-role-badge").innerText = role.toUpperCase();
  document.getElementById("current-username").innerText = user;

  setupNavigation(role);
}

function logout() {
  location.reload();
}

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
      {
        id: "dir-guru-monitoring",
        name: "Monitoring & Rekap",
        icon: "fa-clipboard-user",
      },
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
  document
    .querySelectorAll(".view-section")
    .forEach((sec) => sec.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");

  if (element) {
    document
      .querySelectorAll(".nav-menu li")
      .forEach((li) => li.classList.remove("active"));
    element.parentElement.classList.add("active");
  }
}

// Jam Realtime Dashboard
setInterval(() => {
  const now = new Date();
  const clockEl = document.getElementById("live-clock");
  const dateEl = document.getElementById("live-date");
  if (clockEl) clockEl.innerText = now.toLocaleTimeString();
  if (dateEl) dateEl.innerText = now.toLocaleDateString();
}, 1000);

// Chart Init Dashboard & Scanner Observer
window.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById("attendanceChart");
  if (ctx) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Hadir", "Sakit", "Izin", "Alpa"],
        datasets: [
          {
            label: "# Statistik Kehadiran Hari Ini",
            data: [120, 5, 2, 3],
            backgroundColor: ["#2ecc71", "#f1c40f", "#3498db", "#e74c3c"],
          },
        ],
      },
    });
  }

  // Observer untuk mendeteksi perubahan tampilan section Scan Absen
  const scanSection = document.getElementById("dir-scan-absen");
  if (scanSection) {
    const observer = new MutationObserver(() => {
      initScanner();
    });
    observer.observe(scanSection, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
});

// --- FUNGSI FORM INPUT SISWA ---
function openModalTambahSiswa() {
  const modal = document.getElementById("modal-tambah-siswa");
  if (modal) modal.classList.remove("hidden");
}

function closeModalTambahSiswa() {
  const modal = document.getElementById("modal-tambah-siswa");
  if (modal) modal.classList.add("hidden");
}

function submitDataSiswa(e) {
  e.preventDefault();
  const nama = document.getElementById("input-nama-siswa").value;
  const nisn = document.getElementById("input-nisn-siswa").value;
  const kelas = document.getElementById("input-kelas-siswa").value;

  // Kirim data ke Google Sheets via Apps Script
  const payload = {
    action: "tambahSiswa",
    nama: nama,
    nisn: nisn,
    kelas: kelas,
  };

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(() => {
      alert(
        `Data Siswa Berhasil Disimpan ke Spreadsheet!\nNama: ${nama}\nNISN: ${nisn}\nKelas: ${kelas}`,
      );
      document.getElementById("form-tambah-siswa").reset();
      closeModalTambahSiswa();
    })
    .catch((err) => {
      console.error("Gagal menyimpan data siswa:", err);
      alert("Terjadi kesalahan saat menyimpan data ke server.");
    });
}

// --- FUNGSI FORM INPUT GURU ---
function openModalTambahGuru() {
  const modal = document.getElementById("modal-tambah-guru");
  if (modal) modal.classList.remove("hidden");
}

function closeModalTambahGuru() {
  const modal = document.getElementById("modal-tambah-guru");
  if (modal) modal.classList.add("hidden");
}

function submitDataGuru(e) {
  e.preventDefault();
  const username = document.getElementById("input-username-guru").value;
  const walikelas = document.getElementById("input-walikelas-guru").value;
  const password = document.getElementById("input-pass-guru").value;

  // Kirim data ke Google Sheets via Apps Script
  const payload = {
    action: "tambahGuru",
    username: username,
    walikelas: walikelas,
    password: password,
  };

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(() => {
      alert(
        `Data Guru Berhasil Disimpan ke Spreadsheet!\nUsername/NIP: ${username}\nWali Kelas: ${walikelas}`,
      );
      document.getElementById("form-tambah-guru").reset();
      closeModalTambahGuru();
    })
    .catch((err) => {
      console.error("Gagal menyimpan data guru:", err);
      alert("Terjadi kesalahan saat menyimpan data ke server.");
    });
}

// --- INTEGRASI QR CODE SCANNER & KONTROL KAMERA ---
let html5QrCode = null;

function initScanner() {
  const scanSection = document.getElementById("dir-scan-absen");
  if (scanSection && !scanSection.classList.contains("hidden")) {
    startScanner("environment"); // Default kamera belakang
  } else {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode
        .stop()
        .catch((err) => console.error("Gagal menghentikan scanner:", err));
    }
  }
}

function startScanner(facingMode = "environment") {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("reader");
  }

  const config = { fps: 10, qrbox: { width: 220, height: 220 } };

  // Jika sedang berjalan, hentikan dulu sebelum ganti kamera
  if (html5QrCode.isScanning) {
    html5QrCode
      .stop()
      .then(() => {
        runScannerStart(facingMode, config);
      })
      .catch((err) =>
        console.error("Gagal menghentikan scanner sebelumnya:", err),
      );
  } else {
    runScannerStart(facingMode, config);
  }
}

function runScannerStart(facingMode, config) {
  html5QrCode
    .start(
      { facingMode: facingMode },
      config,
      (decodedText, decodedResult) => {
        const resEl = document.getElementById("scan-result");
        if (resEl) {
          resEl.innerHTML = `
          <div class="alert alert-success p-2" style="background: #d4edda; color: #155724; border-radius: 5px;">
              <i class="fa-solid fa-check-circle"></i> Berhasil Absen! ID/NISN: <strong>${decodedText}</strong>
          </div>
        `;
        }

        // Kirim hasil scan QR (Absen) ke Google Apps Script / Spreadsheet
        kirimDataAbsenOtomatis(decodedText);
      },
      (errorMessage) => {},
    )
    .catch((err) => {
      console.error("Gagal memulai kamera:", err);
      const resEl = document.getElementById("scan-result");
      if (resEl) {
        resEl.innerHTML = `
        <div class="alert alert-danger p-2" style="background: #f8d7da; color: #721c24; border-radius: 5px;">
            <i class="fa-solid fa-triangle-exclamation"></i> Gagal mengakses kamera. Pastikan izin kamera aktif (gunakan HTTPS/Localhost).
        </div>
      `;
      }
    });
}

// Fungsi helper untuk mengirim data absen hasil scan ke Google Apps Script
function kirimDataAbsenOtomatis(nisn) {
  const payload = {
    action: "simpanAbsen",
    nama: "Siswa (" + nisn + ")", // Bisa disesuaikan jika ada fungsi lookup data siswa
    nisn: nisn,
    kelas: "-",
    keterangan: "Hadir",
  };

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(() => {
      console.log("Absen berhasil dikirim ke Spreadsheet untuk NISN:", nisn);
    })
    .catch((err) => {
      console.error("Gagal mengirim data absen:", err);
    });
}

// Fungsi untuk tombol Pilih Kamera (Belakang/Depan)
function switchCamera(facingMode) {
  startScanner(facingMode);
}

// Fungsi tombol Kembali
function backToDashboard() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().catch((err) => console.error(err));
  }
  // Kembali ke menu dashboard utama
  switchView("dir-dashboard");
}

// Fungsi Template Bawaan Lainnya
function refreshDashboard() {
  alert("Data dashboard diperbarui!");
}
function refreshDataSiswa() {
  alert("Data siswa dimuat ulang!");
}
function refreshDataGuru() {
  alert("Data guru dimuat ulang!");
}
function filterLaporan() {
  alert("Memfilter laporan...");
}
function exportLaporan(type) {
  alert("Export ke " + type.toUpperCase());
}
function simpanPengaturanWaktu() {
  alert("Pengaturan waktu disimpan!");
}
function openModalTambahLibur() {
  alert("Tambah hari libur");
}
function cetakImportPdfGuru() {
  alert("Cetak / Import PDF Rekap");
}
function cetakAbsenSiswa() {
  alert("Mencetak absen siswa...");
}

// Integrasi dengan Google Apps Script
function callGoogleScript(functionName, param, callback) {
  if (typeof google !== "undefined" && google.script && google.script.run) {
    google.script.run.withSuccessHandler(callback)[functionName](param);
  } else {
    console.warn(
      "Google Apps Script environment not found. Running in simulation mode.",
    );
  }
}
