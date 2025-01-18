#!/bin/bash

# Create dev directory if it doesn't exist
mkdir -p dev

# Copy manifest and other static files
cp public/manifest.dev.json dev/manifest.json
cp public/popup.html dev/popup.html

# Start dev server
pnpm dev
