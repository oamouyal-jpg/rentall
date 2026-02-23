#!/usr/bin/env bash
# Build script for Render

set -e

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

echo "=== Installing Node.js dependencies ==="
cd frontend
npm install

echo "=== Building React frontend ==="
npm run build

echo "=== Copying build to backend static folder ==="
rm -rf ../backend/static
cp -r build ../backend/static

echo "=== Build complete ==="
