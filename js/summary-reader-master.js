document.addEventListener("DOMContentLoaded", function () {
  const iframe = document.getElementById("h5p-frame");
  const button = document.getElementById("btnGetSummary");

  if (!iframe || !button) {
    console.error("❌ iframe atau button tidak ditemukan");
    return;
  }

  function getIframeDocument() {
    try {
      return iframe.contentWindow.document;
    } catch (e) {
      console.error("❌ Tidak bisa akses iframe (cross-origin)");
      return null;
    }
  }

  function getSummaryData() {
    const doc = getIframeDocument();
    if (!doc) return null;

    const summaryRoot = doc.querySelector(
      ".h5p-interactive-box-summary-progress"
    );

    if (!summaryRoot) return null;

    /* ===============================
       TOTAL SCORE
    =============================== */
    const scoreValues = summaryRoot.querySelectorAll(
      ".h5p-interactive-book-summary-score-progress .absolute-value"
    );

    const scoreObtained = scoreValues[0]
      ? parseInt(scoreValues[0].textContent, 10)
      : 0;

    const scoreTotal = scoreValues[1]
      ? parseInt(scoreValues[1].textContent, 10)
      : 0;

    /* ===============================
       BOOK PROGRESS (%)
    =============================== */
    const bookProgressPercentEl = summaryRoot.querySelector(
      ".h5p-interactive-book-summary-book-progress .h5p-interactive-book-summary-progressbox-bigtext"
    );

    const bookProgressPercent = bookProgressPercentEl
      ? parseInt(bookProgressPercentEl.textContent.replace("%", ""), 10)
      : 0;

    /* ===============================
       PAGE PROGRESS (X of Y pages)
    =============================== */
    const pageProgressText = summaryRoot.querySelector(
      ".h5p-interactive-book-summary-book-progress .h5p-interactive-book-summary-progressbox-smalltext"
    );

    let pagesOpened = 0;
    let pagesTotal = 0;

    if (pageProgressText) {
      const match = pageProgressText.textContent.match(/(\d+)\s+of\s+(\d+)/);
      if (match) {
        pagesOpened = parseInt(match[1], 10);
        pagesTotal = parseInt(match[2], 10);
      }
    }

    /* ===============================
       INTERACTION PROGRESS
    =============================== */
    const interactionText = summaryRoot.querySelector(
      ".h5p-interactive-book-summary-interactions-progress .h5p-interactive-book-summary-progressbox-smalltext"
    );

    let interactionsDone = 0;
    let interactionsTotal = 0;

    if (interactionText) {
      const match = interactionText.textContent.match(/(\d+)\s+of\s+(\d+)/);
      if (match) {
        interactionsDone = parseInt(match[1], 10);
        interactionsTotal = parseInt(match[2], 10);
      }
    }

    const interactionPercent =
      interactionsTotal > 0
        ? Math.round((interactionsDone / interactionsTotal) * 100)
        : 0;

    return {
      // score
      scoreObtained,
      scoreTotal,

      // book
      bookProgressPercent,
      pagesOpened,
      pagesTotal,

      // interaction
      interactionsDone,
      interactionsTotal,
      interactionPercent,

      completed: interactionsDone === interactionsTotal
    };
  }

  /* ==================================
     AKTIFKAN BUTTON HANYA DI SUMMARY
  ================================== */
  const waitForSummary = setInterval(() => {
    const summary = getSummaryData();
    if (summary) {
      button.disabled = false;
      clearInterval(waitForSummary);
      console.log("✅ Summary page detected");
    }
  }, 800);

  /* ==================================
     BUTTON TRIGGER
  ================================== */
  button.addEventListener("click", function () {
    const summary = getSummaryData();
    if (!summary) return;

    console.log("📘 SUMMARY DATA:", summary);

    alert(
      `Score: ${summary.scoreObtained}\n` +
      `Score Total: ${summary.scoreTotal}\n` +
      `Opened Pages: ${summary.pagesOpened}\n` +
      `Pages Total: ${summary.pagesTotal}\n` +
      `Book Progress %: ${summary.bookProgressPercent}%\n` +
      `Interactions: ${summary.interactionsDone}\n` +
      `Interactions Total: ${summary.interactionsTotal}\n` +
      `Interaction %: ${summary.interactionPercent}%`
    );
  });
});
