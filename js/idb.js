// 1. KITA PAKAI NAMA DB YANG SANGAT UNIK AGAR TIDAK BENTROK
const DB_NAME = "DB_H5P_BOOK_SCORES"; 
const DB_VERSION = 1;
const STORE_NAME = "scores";

let dbInstance = null;

console.log("🔵 [STEP 1] Memulai script debug...");
console.log("🔵 [STEP 2] Nama DB Baru:", DB_NAME);

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

function debugOpenDB() {
  return new Promise((resolve, reject) => {
    console.log("🔵 [STEP 3] Memanggil indexedDB.open()");
    
    // Cek apakah IndexedDB didukung
    if (!window.indexedDB) {
        alert("CRITICAL: Browser ini tidak support IndexedDB!");
        return reject("No IndexedDB");
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      console.warn("🟠 [STEP 4] Event 'onupgradeneeded' BERJALAN!");
      const db = e.target.result;
      
      try {
        console.log("🟠 [STEP 5] Mencoba membuat store...");
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        console.log("🟢 [STEP 6] Store berhasil didefinisikan di object:", store);
      } catch (err) {
        console.error("🔴 [FAIL] Gagal saat createObjectStore:", err);
      }
    };

    request.onsuccess = (e) => {
      console.log("🔵 [STEP 7] Event 'onsuccess' BERJALAN (Koneksi terbuka)");
      const db = e.target.result;
      
      // CEK APAKAH STORE ADA
      if (db.objectStoreNames.contains(STORE_NAME)) {
        console.log("🟢 [SUCCESS] Store DITEMUKAN! Database normal.");
        resolve(db);
      } else {
        console.error("🔴 [FAIL] Store TIDAK DITEMUKAN di dalam onsuccess!");
        console.error("   Daftar store yang ada:", db.objectStoreNames);
        console.error("   Penyebab: onupgradeneeded mungkin tidak jalan atau gagal finish.");
        reject("Store Missing");
      }
    };

    request.onerror = (e) => {
      console.error("🔴 [FAIL] Event 'onerror' muncul:", e.target.error);
      reject(e.target.error);
    };
    
    request.onblocked = () => {
        console.error("🔴 [FAIL] Database BLOCKED! Tutup tab lain.");
    };
  });
}

// Jalankan tes otomatis
debugOpenDB().then(async (db) => {
    console.log("🔵 [STEP 8] Mencoba transaksi simpan data...");
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({ test: "data", time: new Date() });
    console.log("🏁 [FINISH] Transaksi berhasil dikirim tanpa error!");
}).catch(err => {
    console.log("💀 [GAME OVER] Debugging selesai dengan error.");
});

async function saveScore(data) {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      // Mulai Transaksi
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      
      const item = { ...data, savedAt: new Date().toISOString() };
      
      const req = store.add(item);

      req.onsuccess = () => {
        console.log("💾 Data tersimpan:", item);
        resolve(item);
      };
      
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });

  } catch (error) {
    console.error("Error saveScore:", error);
    alert("Gagal menyimpan: " + error.message);
  }
}