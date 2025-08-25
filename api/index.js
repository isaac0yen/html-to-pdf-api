const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const apiDocumentation = {
  description: "HTML to PDF Conversion API",
  usage: {
    method: "POST",
    endpoint: "/api/generate-pdf",
    required_body: { html: "<h1>Your HTML content</h1>" },
    example: {
      curl: `curl -X POST -H "Content-Type: application/json" -d '{"html":"<h1>Hello World</h1>"}' https://your-vercel-domain.vercel.app/api/generate-pdf`
    }
  }
};

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json(apiDocumentation);
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
