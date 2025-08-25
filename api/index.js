const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

module.exports = async function handler(req, res) {
  // Serve UI form on GET
  if (req.method === "GET") {
    const htmlForm = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>HTML → PDF Generator</title>
        <style>
          body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
          textarea { width: 100%; height: 200px; margin: 10px 0; }
          button { padding: 10px 20px; background: black; color: white; border: none; cursor: pointer; }
          button:hover { opacity: 0.8; }
        </style>
      </head>
      <body>
        <h1>HTML → PDF Generator</h1>
        <form method="POST" action="/api/generate-pdf">
          <label for="html">Enter HTML content:</label><br>
          <textarea name="html" id="html" required><h1>Hello World</h1></textarea><br>
          <button type="submit">Generate PDF</button>
        </form>
      </body>
      </html>
    `;
    return res.status(200).send(htmlForm);
  }

  // Block unsupported methods
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse HTML from request body (works with x-www-form-urlencoded or JSON)
  let html = req.body?.html;
  if (!html && req.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
    // If form submission
    let body = "";
    for await (const chunk of req) body += chunk;
    const params = new URLSearchParams(body);
    html = params.get("html");
  }

  if (!html) return res.status(400).json({ error: "HTML content is required" });

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=document.pdf");
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (browser) await browser.close();
  }
};
