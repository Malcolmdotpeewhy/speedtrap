#!/bin/bash

# setup-apk.sh
# Automates the setup of Capacitor for Android APK generation

set -e # Exit on error

echo "🚗 Setting up DrivePro for Android APK..."

# 1. Install Dependencies
echo "📦 Installing dependencies..."
npm install
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android

# 2. Initialize Capacitor if not already initialized
if [ ! -f "capacitor.config.ts" ] && [ ! -f "capacitor.config.json" ]; then
    echo "⚡ Initializing Capacitor..."
    npx cap init DrivePro com.example.drivepro --web-dir dist
else
    echo "✅ Capacitor already initialized."
fi

# 3. Add Android Platform
if [ ! -d "android" ]; then
    echo "🤖 Adding Android platform..."
    npx cap add android
else
    echo "✅ Android platform already added."
fi

echo "🎉 Setup complete! You can now run 'npm run apk:build' to generate your APK."
