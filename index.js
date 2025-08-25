const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const apiDocumentation = {
  description: "HTML to PDF Conversion API",
  usage: {
    method: "POST",
    endpoint: "/",
    required_body: {
      html: "<h1>Your HTML content</h1>"
    },
    example: {
      curl: 'curl -X POST -H "Content-Type: application/json" -d \'{"html":"<h1>Hello World</h1>"}\' YOUR_API_URL'
    }
  },
  response: {
    success: "PDF file (application/pdf)",
    errors: [
      { status: 400, message: "HTML content is required" },
      { status: 405, message: "Method not allowed" },
      { status: 500, message: "Internal server error" }
    ]
  },
  notes: [
    "The API converts provided HTML content to a PDF file.",
    "The response will be a downloadable PDF file.",
    "Make sure to include proper HTML structure for best results."
  ]
};

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json(apiDocumentation);
  }
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { html } = req.body;
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
    res.send(pdfBuffer);

  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (browser) await browser.close();
  }
};
