// Konfigurasi URL Web App Google Apps Script
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzxLmsqlAyzAITexPZkbv5ZepWCF8ZCtVJ2iBI-pAkGrmYeRKgur4r0ZiZ0khKqngHL/exec";

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
        (s) => String(s.nisn).trim() === String(user).trim(),
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
  const target = document.getElementById(viewId);
  if (target) target.classList.remove("hidden");

  if (element) {
    document
      .querySelectorAll(".nav-menu li")
      .forEach((li) => li.classList.remove("active"));
    element.parentElement.classList.add("active");
  }
}

// --- 3. JAM & TANGGAL REALTIME ---
setInterval(() => {
  const now = new Date();
  const clockEl = document.getElementById("live-clock");
  const dateEl = document.getElementById("live-date");
  if (clockEl) clockEl.innerText = now.toLocaleTimeString();
  if (dateEl)
    dateEl.innerText = now.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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

  // Muat data server (dipanggil di dalam event listener yang benar)
  loadDataGuruDariServer();
  loadDataSiswaDariServer();
});

// --- 5. AMBIL DATA DARI SERVER ---
function loadDataSiswaDariServer() {
  fetch(`${WEB_APP_URL}?action=getSiswa`, {
    method: "GET",
    redirect: "follow",
  })
    .then((res) => res.json())
    .then((data) => {
      dataSiswaList = data;
      renderTabelSiswa();
      const statTotal = document.getElementById("stat-total");
      if (statTotal) statTotal.innerText = data.length;
    })
    .catch((err) => {
      // Jika masih terkena CORS tapi data masuk, kita abaikan atau gunakan fallback
      console.warn("Catatan fetch siswa:", err);
    });
}

function renderTabelSiswa() {
  const tbody = document.getElementById("table-siswa-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!dataSiswaList || dataSiswaList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 15px;">Belum ada data siswa.</td></tr>`;
    return;
  }

  dataSiswaList.forEach((siswa, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${siswa.nama}</td>
        <td>${siswa.nisn}</td>
        <td>${siswa.kelas}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="hapusSiswa(${index})">
            <i class="fa-solid fa-trash"></i> Hapus
          </button>
        </td>
      </tr>
    `;
  });
}

function loadDataSiswaDariServer() {
  fetch(`${WEB_APP_URL}?action=getSiswa`, {
    method: "GET",
    redirect: "follow",
  })
    .then((res) => res.json())
    .then((data) => {
      dataSiswaList = data;
      renderTabelSiswa();
      const statTotal = document.getElementById("stat-total");
      if (statTotal) statTotal.innerText = data.length;
    })
    .catch((err) => {
      // Jika masih terkena CORS tapi data masuk, kita abaikan atau gunakan fallback
      console.warn("Catatan fetch siswa:", err);
    });
}

function refreshDashboard() {
  loadDataSiswaDariServer();
  loadDataGuruDariServer();
  alert("Data dashboard berhasil diperbarui!");
}
// --- 6. FUNGSI TAMBAH DATA (SISWA & GURU) ---
function submitDataSiswa(e) {
  e.preventDefault();
  const nama = document.getElementById("input-nama-siswa").value;
  const nisn = document.getElementById("input-nisn-siswa").value;
  const kelas = document.getElementById("input-kelas-siswa").value;

  const payload = { action: "tambahSiswa", nama, nisn, kelas };

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(() => {
      alert("Data Siswa Berhasil Disimpan!");
      document.getElementById("form-tambah-siswa").reset();
      closeModalTambahSiswa();

      // BERIKAN JEDA SEDIKIT LALU TARIK DATA TERBARU DARI SERVER
      setTimeout(() => {
        loadDataSiswaDariServer();
      }, 1000); // Jeda 1 detik agar Google Sheets sempat memproses baris baru
    })
    .catch((err) => {
      console.error("Gagal menyimpan data siswa:", err);
      alert("Terjadi kesalahan saat menyimpan data ke server.");
    });
}

function submitDataGuru(e) {
  e.preventDefault();
  const username = document.getElementById("input-username-guru").value;
  const walikelas = document.getElementById("input-walikelas-guru").value;
  const password = document.getElementById("input-pass-guru").value;

  const payload = { action: "tambahGuru", username, walikelas, password };

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(() => {
      alert("Data Guru Berhasil Disimpan!");
      document.getElementById("form-tambah-guru").reset();
      closeModalTambahGuru();

      setTimeout(() => {
        loadDataGuruDariServer();
      }, 1000);
    })
    .catch((err) => {
      console.error("Gagal menyimpan data guru:", err);
    });
}

// --- 7. FUNGSI SCANNER ---
let html5QrCode = null;

function initScanner() {
  const scanSection = document.getElementById("dir-scan-absen");
  if (scanSection && !scanSection.classList.contains("hidden")) {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          alert("Berhasil Scan: " + decodedText);
          kirimDataAbsenOtomatis(decodedText);
        },
      )
      .catch((err) => console.error("Kamera gagal:", err));
  } else if (html5QrCode) {
    html5QrCode.stop().catch((err) => console.log(err));
  }
}

// --- FUNGSI HELPER UNTUK MENGIRIM DATA ABSEN HASIL SCAN ---
function kirimDataAbsenOtomatis(nisn) {
  const cleanNisn = String(nisn).trim();
  const siswa = dataSiswaList.find((s) => String(s.nisn).trim() === cleanNisn);

  const namaSiswa = siswa ? siswa.nama : "Siswa (" + cleanNisn + ")";
  const kelasSiswa = siswa ? siswa.kelas : "-";

  const payload = {
    action: "simpanAbsen",
    nama: namaSiswa,
    nisn: cleanNisn,
    kelas: kelasSiswa,
    keterangan: "Hadir",
  };

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(() => {
      console.log(
        `Absen berhasil dikirim untuk: ${namaSiswa} (${cleanNisn}) - Kelas: ${kelasSiswa}`,
      );
      const resEl = document.getElementById("scan-result");
      if (resEl) {
        resEl.innerHTML = `
          <div class="alert alert-success p-2" style="background: #d4edda; color: #155724; border-radius: 5px;">
              <i class="fa-solid fa-check-circle"></i> Berhasil Absen!<br>
              <strong>${namaSiswa}</strong> (NISN: ${cleanNisn})<br>
              Kelas: ${kelasSiswa}
          </div>
        `;
      }
    })
    .catch((err) => {
      console.error("Gagal mengirim data absen:", err);
    });
}

function switchCamera(mode) {
  if (html5QrCode) html5QrCode.stop().then(() => startScanner(mode));
}

// --- 8. FUNGSI MODAL & HELPERS ---
function openModalTambahSiswa() {
  document.getElementById("modal-tambah-siswa").classList.remove("hidden");
}
function closeModalTambahSiswa() {
  document.getElementById("modal-tambah-siswa").classList.add("hidden");
}
function openModalTambahGuru() {
  document.getElementById("modal-tambah-guru").classList.remove("hidden");
}
function closeModalTambahGuru() {
  document.getElementById("modal-tambah-guru").classList.add("hidden");
}
function backToDashboard() {
  switchView("dir-dashboard");
}

// Observer untuk Scanner (agar otomatis nyala saat menu dipilih)
const observer = new MutationObserver(() => initScanner());
const scanSection = document.getElementById("dir-scan-absen");
if (scanSection)
  observer.observe(scanSection, {
    attributes: true,
    attributeFilter: ["class"],
  });
// --- FUNGSI RENDER TABEL SISWA ---
function renderTabelSiswa() {
  const tbody = document.getElementById("table-siswa-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (dataSiswaList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 15px;">Belum ada data siswa.</td></tr>`;
    return;
  }

  dataSiswaList.forEach((siswa, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${siswa.nama}</td>
        <td>${siswa.nisn}</td>
        <td>${siswa.kelas}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="hapusSiswa(${index})">
            <i class="fa-solid fa-trash"></i> Hapus
          </button>
        </td>
      </tr>
    `;
  });
}
function refreshDataSiswa() {
  loadDataSiswaDariServer();
  alert("Data siswa berhasil dimuat ulang dari server!");
}

function refreshDataGuru() {
  loadDataGuruDariServer();
  alert("Data guru berhasil dimuat ulang dari server!");
}
