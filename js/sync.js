const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbxKlcHK6Ypme25jlpqvLmSxRRHPWE7WGv8k9qnoJv5H9fcq803ikj-aBPyd4XoJSRoOCw/exec"; // GANTI

/* ================================
   BUKA DATABASE
================================ */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("❌ DB gagal dibuka");
  });
}

/* ================================
   AMBIL DATA BELUM SYNC
================================ */
async function getUnsyncedScores() {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const unsynced = req.result.filter(r => !r.synced);
      resolve(unsynced);
    };
  });
}

/* ================================
   UPDATE STATUS SYNC
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
      data.synced = true;
      store.put(data);
    };
  });
}

/* ================================
   KIRIM KE GOOGLE SHEET (ANTI-CORS)
================================ */
async function syncToGoogleSheet() {
  if (!navigator.onLine) {
    alert("❌ Tidak ada koneksi internet");
    return;
  }

  const data = await getUnsyncedScores();

  if (!data.length) {
    alert("ℹ️ Tidak ada data untuk disinkron");
    return;
  }

  try {
    // ⬅️ HINDARI PREFLIGHT
    const payload = encodeURIComponent(JSON.stringify(data));
    console.log(payload);

    const res = await fetch(SHEET_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "records=" + payload
    });

    const text = await res.text();
    const result = JSON.parse(text);

    if (!result.success) throw new Error("Server error");

    await markAsSynced(data.map(d => d.id));

    alert("☁️ Sinkronisasi berhasil");
    console.log("✅ Data terkirim:", data);

  } catch (err) {
    console.error("❌ Sync error:", err);
    alert("❌ Sinkron gagal");
  }
}

/* ================================
   HUBUNGKAN KE TOMBOL
================================ */
document.addEventListener("DOMContentLoaded", () => {
  const btnSync = document.getElementById("btnSync");
  if (!btnSync) return;

  btnSync.addEventListener("click", syncToGoogleSheet);
});

