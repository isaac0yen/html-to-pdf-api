const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const path = require("path");
const fs = require("fs");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const htmlForm = fs.readFileSync(
      path.resolve(__dirname, "../client/index.html"),
      "utf8"
    );
    return res.status(200).send(htmlForm);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { html } = req.body || {};
  if (!html) return res.status(400).json({ error: "HTML content is required" });

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=document.pdf");
    res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (browser) await browser.close();
  }
};
