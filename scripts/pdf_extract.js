window.__DP_pdf = async function (pdfId) {
  const url = "https://dergipark.org.tr/tr/download/article-file/" + pdfId;
  try {
    const lib = window.pdfjsLib || (window.pdfjsDist && window.pdfjsDist);
    if (!lib || !lib.getDocument) throw new Error("pdfjs-not-loaded");
    if (lib.GlobalWorkerOptions && window.__DP_PDF_WORKER) {
      lib.GlobalWorkerOptions.workerSrc = window.__DP_PDF_WORKER;
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
