# Text Extractor Chrome Extension

A Chrome extension that allows you to extract text from any webpage using OCR technology. Simply select an area on the page, and the extension will extract and display the text content.

## Features

- Works on any webpage
- Simple selection interface
- OCR-powered text extraction
- Instant results display

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from this project

## Usage

1. Click the extension icon in Chrome
2. Draw a rectangle around the text you want to extract
3. The extracted text will appear in a floating box
4. The text will disappear after 5 seconds

## Development

- `npm run dev` - Start development server
- `npm run build` - Build the extension
- `npm run lint` - Lint the code
