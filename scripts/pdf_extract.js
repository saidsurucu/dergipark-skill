// Self-contained PDF text extractor. DergiPark sends no CSP, so we load pdf.js
// (v3 UMD, exposes window.pdfjsLib) from a CDN and run its worker from a blob.
// The vendored scripts/pdfjs.min.js + scripts/pdfjs.worker.min.js are the offline
// fallback: inject their contents before this file to pre-set window.pdfjsLib /
// window.__DP_PDF_WORKER, and the loader below will skip the network fetch.
window.__DP_PDF_CDN = window.__DP_PDF_CDN || "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js";
window.__DP_PDF_WORKER_CDN = window.__DP_PDF_WORKER_CDN || "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js";

window.__DP_pdf = async function (pdfId) {
  const url = "https://dergipark.org.tr/tr/download/article-file/" + pdfId;
  try {
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = window.__DP_PDF_CDN;
        s.onload = resolve;
        s.onerror = () => reject(new Error("pdfjs-load-failed"));
        document.head.appendChild(s);
      });
    }
    const lib = window.pdfjsLib;
    if (!lib || !lib.getDocument) throw new Error("pdfjs-not-loaded");
    if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
      let workerSrc = window.__DP_PDF_WORKER;
      if (!workerSrc) {
        const wRes = await fetch(window.__DP_PDF_WORKER_CDN);
        workerSrc = URL.createObjectURL(new Blob([await wRes.text()], { type: "text/javascript" }));
      }
      lib.GlobalWorkerOptions.workerSrc = workerSrc;
    }
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("download-failed:" + res.status);
    const data = new Uint8Array(await res.arrayBuffer());
    const pdf = await lib.getDocument({ data }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((it) => it.str).join(" "));
    }
    return { pdf_id: pdfId, pdf_url: url, page_count: pdf.numPages, text: pages.join("\n\n") };
  } catch (e) {
    return { pdf_id: pdfId, pdf_url: url, error: String(e && e.message || e), text: "" };
  }
};
