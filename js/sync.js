/* ================================
   KONFIGURASI (Sesuai dengan IDB sebelumnya)
================================ */
const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbz4sVu15_2lzmgHAjZdQlIL1XYij-B1jJMXROlR4xRvnJESSDpU7IZg-F72KnZ33Z52tA/exec";

/* ================================
   BUKA DATABASE (Versi Stabil)
================================ */
function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    // Tambahkan onupgradeneeded agar struktur tetap terbentuk jika DB kosong
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };
    
    req.onerror = () => reject("❌ DB gagal dibuka");
  });
}

/* ================================
   AMBIL DATA BELUM SYNC (Menggunakan Index)
================================ */
async function getUnsyncedScores() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      // Filter data yang field 'synced'-nya masih false/undefined
      const unsynced = req.result.filter(r => !r.synced);
      resolve(unsynced);
    };
    req.onerror = () => reject("Gagal mengambil data");
  });
}

/* ================================
   UPDATE STATUS SYNC SETELAH BERHASIL
================================ */
async function markAsSynced(ids) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  ids.forEach(id => {
    const req = store.get(id);
    req.onsuccess = () => {
      const data = req.result;
      if (!data) return;
      data.synced = true; // Tandai sudah sinkron
      store.put(data);
    };
  });

  return new Promise((resolve) => {
    tx.oncomplete = () => {
      console.log("✅ Status sync diperbarui di IDB");
      resolve();
    };
  });
}

/* ================================
   KIRIM KE GOOGLE SHEET
================================ */
async function syncToGoogleSheet() {
  const btnSync = document.getElementById("btnSync");
  
  if (!navigator.onLine) {
    alert("❌ Tidak ada koneksi internet");
    return;
  }

  try {
    const data = await getUnsyncedScores();

    if (!data.length) {
      alert("ℹ️ Tidak ada data baru untuk disinkron");
      return;
    }

    // Ubah UI tombol saat loading
    if(btnSync) {
        btnSync.disabled = true;
        btnSync.innerText = "⏳ Sinkronisasi...";
    }

    // Payload dibungkus dalam records=...
    const payload = encodeURIComponent(JSON.stringify(data));

    const res = await fetch(SHEET_ENDPOINT, {
      method: "POST",
      mode: "no-cors", // Gunakan no-cors untuk keamanan Apps Script jika perlu
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "records=" + payload
    });

    /**
     * CATATAN: Karena menggunakan 'no-cors', kita tidak bisa membaca JSON response.
     * Kita asumsikan jika fetch tidak throw error, maka data terkirim.
     */
    
    await markAsSynced(data.map(d => d.id));

    alert("☁️ Sinkronisasi berhasil!");
    console.log("✅ Data terkirim ke Sheets:", data);

  } catch (err) {
    console.error("❌ Sync error:", err);
    alert("❌ Sinkron gagal: " + err.message);
  } finally {
    if(btnSync) {
        btnSync.disabled = false;
        btnSync.innerText = "🔄 Sinkron Data";
    }
  }
}

/* ================================
   HUBUNGKAN KE TOMBOL
================================ */
document.addEventListener("DOMContentLoaded", () => {
  const btnSync = document.getElementById("btnSync");
  if (btnSync) {
    btnSync.addEventListener("click", syncToGoogleSheet);
  }
});