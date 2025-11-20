#!/bin/bash

# Selendra SDK - Setup Script
# This script will set up the new SDK with all dependencies

set -e  # Exit on error

echo "🚀 Setting up Selendra SDK Core..."
echo ""

# Change to sdk.ts directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 16.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version must be >= 16.0.0 (current: $(node -v))"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building SDK..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "You can now:"
echo "  - Run examples: node dist/examples.js"
echo "  - Build: npm run build"
echo "  - Watch: npm run build:watch"
echo "  - Clean: npm run clean"
echo ""
echo "📚 See README.md for documentation"
echo ""
