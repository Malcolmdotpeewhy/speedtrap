#!/bin/bash

# build-apk.sh
# Builds the web app, syncs with Capacitor, and compiles the Android APK

set -e

echo "🏗️  Building Web App..."
npm run build

echo "🔄 Syncing with Capacitor..."
npx cap sync

echo "📱 Attempting to build Android APK..."

if [ -d "android" ]; then
    cd android
    # Check if gradlew exists and is executable
    if [ -f "./gradlew" ]; then
        chmod +x gradlew
        ./gradlew assembleDebug

        echo ""
        echo "✅ APK Build Successful!"
        echo "📂 APK Location: android/app/build/outputs/apk/debug/app-debug.apk"
        echo ""
        echo "To install on connected device: ./gradlew installDebug"
    else
        echo "⚠️  Gradle wrapper not found. Please open Android Studio to build."
        echo "    Command: npx cap open android"
    fi
else
    echo "❌ Android platform not found. Please run 'npm run apk:setup' first."
    exit 1
fi
