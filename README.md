# HTML to PDF API

A standalone Node.js application that converts HTML content to PDF using Puppeteer, featuring rate limiting and a beautiful web interface.

## Features

- 🚀 Fast HTML to PDF conversion using Puppeteer
- 🛡️ Built-in rate limiting (100 requests/15min, 10 PDF generations/5min)
- 🎨 Beautiful web interface for easy PDF generation
- 🔒 Security headers with Helmet.js
- 📱 Responsive design
- ⚡ RESTful API for programmatic access
- 🎛️ Configurable PDF options (format, orientation, margins)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## API Usage

### Generate PDF (POST /generate-pdf)

**Request:**
```bash
curl -X POST http://localhost:3000/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1>Hello World</h1><p>This is a test PDF.</p>",
    "format": "A4",
    "orientation": "portrait",
    "margin": 20,
    "filename": "test.pdf"
  }' \
  --output test.pdf
```

**Parameters:**
- `html` (required): HTML content to convert
- `format` (optional): Page format (A4, A3, A5, Letter, Legal) - default: A4
- `orientation` (optional): portrait or landscape - default: portrait
- `margin` (optional): Margin in pixels - default: 20
- `filename` (optional): Output filename - default: document.pdf

### Other Endpoints

- `GET /` - Web interface
- `GET /health` - Health check
- `GET /api` - API information

## Rate Limiting

- **General requests:** 100 per 15 minutes per IP
- **PDF generation:** 10 per 5 minutes per IP

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Lint code
npm run lint
```

## Docker Support

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Install Chromium dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## License

MIT License - see LICENSE file for details.