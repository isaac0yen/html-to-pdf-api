const express = require('express');
const puppeteer = require('puppeteer');
const chromium = require('@sparticuz/chromium');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const pdfLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 PDF generations per 5 minutes
  message: {
    error: 'Too many PDF generation requests, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Browser instance management
let browser = null;

async function getBrowser() {
  if (!browser) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Use Sparticuz Chromium for serverless environments like Render
      browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--font-render-hinting=none'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      // Local development
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--font-render-hinting=none'
        ]
      });
    }
  }
  return browser;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

// Home page route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HTML to PDF Converter</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        
        .header {
          background: #2c3e50;
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        
        .header p {
          font-size: 1.1em;
          opacity: 0.9;
        }
        
        .content {
          padding: 40px;
        }
        
        .form-group {
          margin-bottom: 25px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
        }
        
        textarea {
          width: 100%;
          min-height: 200px;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
          resize: vertical;
          transition: border-color 0.3s;
        }
        
        textarea:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }
        
        .option-group {
          display: flex;
          flex-direction: column;
        }
        
        select, input {
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s;
        }
        
        select:focus, input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 30px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .btn:active {
          transform: translateY(0);
        }
        
        .example {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin-top: 30px;
          border-radius: 0 8px 8px 0;
        }
        
        .example h3 {
          color: #2c3e50;
          margin-bottom: 15px;
        }
        
        .example code {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        
        .rate-limit-info {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
          color: #856404;
        }
        
        .rate-limit-info strong {
          color: #533f03;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 HTML to PDF Converter</h1>
          <p>Convert your HTML content to beautiful PDF documents</p>
        </div>
        
        <div class="content">
          <div class="rate-limit-info">
            <strong>Rate Limits:</strong> 100 requests per 15 minutes, 10 PDF generations per 5 minutes per IP
          </div>
          
          <form action="/generate-pdf" method="POST">
            <div class="form-group">
              <label for="html">HTML Content:</label>
              <textarea name="html" id="html" placeholder="Enter your HTML content here..." required><!DOCTYPE html>
<html>
<head>
  <title>Sample PDF</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', Arial, sans-serif; 
      margin: 40px; 
    }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    p { line-height: 1.6; margin-bottom: 15px; }
    .highlight { background-color: #f39c12; color: white; padding: 5px 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Welcome to PDF Generation!</h1>
  <p>This is a <span class="highlight">sample HTML</span> that will be converted to PDF.</p>
  <p>You can include any HTML content, CSS styles, images, and even emojis! 🎉✨</p>
  <ul>
    <li>✅ Full HTML support</li>
    <li>✅ CSS styling</li>
    <li>✅ Custom fonts</li>
    <li>✅ Images and graphics</li>
    <li>😀 Emoji support</li>
  </ul>
</body>
</html></textarea>
            </div>
            
            <div class="options">
              <div class="option-group">
                <label for="format">Page Format:</label>
                <select name="format" id="format">
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
              
              <div class="option-group">
                <label for="orientation">Orientation:</label>
                <select name="orientation" id="orientation">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              
              <div class="option-group">
                <label for="margin">Margin (px):</label>
                <input type="number" name="margin" id="margin" value="20" min="0" max="100">
              </div>
              
              <div class="option-group">
                <label for="filename">Filename:</label>
                <input type="text" name="filename" id="filename" value="document.pdf" placeholder="document.pdf">
              </div>
            </div>
            
            <button type="submit" class="btn">Generate PDF 📄</button>
          </form>
          
          <div class="example">
            <h3>API Usage Example:</h3>
            <p>You can also use this service programmatically:</p>
            <p><code>POST /generate-pdf</code></p>
            <p><strong>Content-Type:</strong> <code>application/json</code></p>
            <p><strong>Body:</strong> <code>{"html": "&lt;h1&gt;Hello World&lt;/h1&gt;", "format": "A4", "filename": "test.pdf"}</code></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// PDF generation endpoint
app.post('/generate-pdf', pdfLimiter, async (req, res) => {
  try {
    const { 
      html, 
      format = 'A4', 
      orientation = 'portrait',
      margin = 20,
      filename = 'document.pdf'
    } = req.body;

    if (!html) {
      return res.status(400).json({ 
        error: 'HTML content is required' 
      });
    }

    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();

    // Set content and wait for any resources to load
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Ensure proper emoji and UTF-8 support
    await page.evaluateOnNewDocument(() => {
      document.charset = 'UTF-8';
    });

    // Generate PDF with options
    const pdfBuffer = await page.pdf({
      format: format,
      landscape: orientation === 'landscape',
      margin: {
        top: `${margin}px`,
        right: `${margin}px`,
        bottom: `${margin}px`,
        left: `${margin}px`
      },
      printBackground: true,
      preferCSSPageSize: true
    });

    await page.close();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'HTML to PDF API',
    version: '1.0.0',
    endpoints: {
      'GET /': 'Home page with HTML form',
      'POST /generate-pdf': 'Generate PDF from HTML',
      'GET /health': 'Health check',
      'GET /api': 'API information'
    },
    rateLimits: {
      general: '100 requests per 15 minutes',
      pdfGeneration: '10 requests per 5 minutes'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: ['/', '/generate-pdf', '/health', '/api']
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 HTML to PDF API running on port ${PORT}`);
  console.log(`📝 Home page: http://localhost:${PORT}`);
  console.log(`🔧 API info: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});