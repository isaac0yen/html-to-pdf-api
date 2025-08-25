# HTML to PDF API (Serverless)

A small open-source Node.js API (ideal for deployment on Vercel or AWS Lambda) that accepts raw HTML via POST and returns a PDF, using the latest `puppeteer-core` (v24.17.0) plus `chrome-aws-lambda` (v10.1.0).

## Features
- **Up-to-date Puppeteer features**: Firefox 142.0 cross-browser support, `Page.setJavaScriptEnabled` toggle.  
- **Lightweight serverless support**: `chrome-aws-lambda` optimized Chromium with custom font embedding.  
- Easy to deploy — just `POST` HTML and get back a PDF.

## Usage

### Deploy
```bash
vercel deploy --prod
```

### Request PDF
```bash
curl -X POST https://<your-deploy-url>/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Hello</h1><p>Sir Isaac0yen</p>"}' --output result.pdf
```

### Local Develop
```bash
npm install
npm run dev
```

### Acknowledgments
- [puppeteer-core](https://github.com/puppeteer/puppeteer) by the Google Chrome team
- [chrome-aws-lambda](https://github.com/alixaxel/chrome-aws-lambda) by @alixaxel
