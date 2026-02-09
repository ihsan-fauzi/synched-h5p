document.addEventListener("DOMContentLoaded", function () {
  const iframe = document.getElementById("h5p-frame");
  const btnSave = document.getElementById("btnSave");
  const btnSync = document.getElementById("btnSync");

  if (!iframe || !btnSave || !btnSync) {
    console.error("❌ iframe / tombol tidak ditemukan");
    return;
  }

  function getIframeDocument() {
    try {
      return iframe.contentWindow.document;
    } catch (e) {
      return null;
    }
  }

  /* =====================================
     CEK SUMMARY BENAR-BENAR TERLIHAT
  ===================================== */
  function isSummaryVisible() {
    const doc = getIframeDocument();
    if (!doc) return false;

    const el = doc.querySelector(
      ".h5p-interactive-box-summary-progress"
    );
    if (!el) return false;

    // KUNCI UTAMA
    return el.offsetParent !== null;
  }

  /* =====================================
     AMBIL SUMMARY DATA
  ===================================== */
  function getSummaryData() {
    if (!isSummaryVisible()) return null;

    const doc = getIframeDocument();
    const root = doc.querySelector(
      ".h5p-interactive-box-summary-progress"
    );
    if (!root) return null;

    const scoreEls = root.querySelectorAll(
      ".h5p-interactive-book-summary-score-progress .absolute-value"
    );
    if (scoreEls.length < 2) return null;

    const pageText = root.querySelector(
      ".h5p-interactive-book-summary-book-progress .h5p-interactive-book-summary-progressbox-smalltext"
    )?.textContent;

    const interText = root.querySelector(
      ".h5p-interactive-book-summary-interactions-progress .h5p-interactive-book-summary-progressbox-smalltext"
    )?.textContent;

    const pageMatch = pageText?.match(/(\d+)\s+of\s+(\d+)/);
    const interMatch = interText?.match(/(\d+)\s+of\s+(\d+)/);

    if (!pageMatch || !interMatch) return null;

    return {
      scoreObtained: parseInt(scoreEls[0].textContent, 10),
      scoreTotal: parseInt(scoreEls[1].textContent, 10),
      pagesOpened: parseInt(pageMatch[1], 10),
      pagesTotal: parseInt(pageMatch[2], 10),
      interactionsDone: parseInt(interMatch[1], 10),
      interactionsTotal: parseInt(interMatch[2], 10),
      completed:
        parseInt(interMatch[1], 10) === parseInt(interMatch[2], 10)
    };
  }

  /* =====================================
     AKTIFKAN TOMBOL SAAT SUMMARY MUNCUL
  ===================================== */
  const wait = setInterval(() => {
    if (isSummaryVisible()) {
      btnSave.disabled = false;
      btnSync.disabled = !navigator.onLine;
      clearInterval(wait);
      console.log("✅ Summary tampil — tombol aktif");
    }
  }, 500);

  /* =====================================
     BUTTON ACTION
  ===================================== */
  btnSave.addEventListener("click", async () => {
    const data = getSummaryData();
    if (!data) {
      alert("❌ Summary belum lengkap");
      return;
    }

    await saveScore(data);
    alert("✅ Nilai tersimpan (offline)");
    btnSync.disabled = false;
  });

  window.addEventListener("online", () => {
    if (isSummaryVisible()) btnSync.disabled = false;
  });
});
