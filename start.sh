#!/bin/bash

echo "🚀 Starting FinTrace PDF Generator..."

# Check if dist/index.js exists
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: dist/index.js not found!"
    echo "📁 Current directory contents:"
    ls -la
    echo "📁 Dist directory contents:"
    ls -la dist/ || echo "Dist directory does not exist"
    exit 1
fi

echo "✅ Found dist/index.js"
echo "📋 Node version: $(node --version)"
echo "📋 NPM version: $(npm --version)"
echo "🌍 Environment: $NODE_ENV"
echo "🔌 Port: $PORT"

# Verify Google Chrome
echo "🔍 Verifying Google Chrome..."
if command -v google-chrome-stable &> /dev/null; then
    echo "✅ Google Chrome found: $(google-chrome-stable --version)"
else
    echo "❌ Google Chrome not found!"
    echo "🔍 Searching in common locations..."
    ls -la /usr/bin/*chrome* 2>/dev/null || echo "No chrome files found in /usr/bin/"
    exit 1
fi

# Start the application
echo "🚀 Starting application..."
exec node dist/index.js 