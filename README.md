<div align="center">
  <div style="font-size: 3rem;">🚗 DrivePro</div>
  <h3>Advanced AI-Powered Speed Monitoring Dashboard</h3>
</div>

<br />

DrivePro (also known as SpeedLimit Pro) is a modern, React-based dashboard designed to help drivers monitor their speed, adhere to speed limits, and log road data using Google Gemini AI. It provides real-time visualizations, intelligent speed limit detection, and cloud syncing capabilities.

This project is built with **React 19**, **Tailwind CSS v4**, and **Vite**, offering a lightning-fast and responsive experience on both web and mobile.

---

## ✨ Features

*   **Real-time Speed Monitoring**: Visual speedometer with dynamic color coding based on current speed vs. speed limit.
*   **AI Road Intelligence**: Integrates with **Google Gemini API** to analyze road conditions and provide intelligent insights.
*   **Dual View Modes**:
    *   **Dashboard View**: Full-screen detailed view for tablets or dedicated displays.
    *   **Widget View**: Compact, floating-style widget for mobile overlay use.
*   **Google Drive Sync**: Automatically logs trip data and syncs it to your Google Drive for historical analysis.
*   **Offline Support**: Caches logs locally when offline and syncs when connectivity is restored.
*   **Responsive Design**: Optimized for mobile viewports (Pixel 7 etc.) and desktop.
*   **Dark Mode**: Sleek, distraction-free dark UI optimized for night driving.

## 🛠️ Tech Stack

*   **Framework**: React 19 + TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS v4
*   **AI**: Google Gemini API (`@google/genai`)
*   **Storage**: LocalStorage + Google Drive API
*   **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/drivepro.git
    cd drivepro
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  **Configuration**:
    *   Create a `.env.local` file in the root directory.
    *   Add your Gemini API Key:
        ```env
        VITE_GEMINI_API_KEY=your_api_key_here
        ```
    *   *Note: Google Drive integration requires a Client ID. You may need to replace the `CLIENT_ID` placeholder in `src/services/googleDriveService.ts` with your own from the Google Cloud Console.*

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📱 Converting to Android APK

You can easily convert this web application into a native Android APK using **Capacitor**. This allows you to install it on your phone and run it as a standalone app.

### Step 1: Initialize Capacitor

First, verify that `vite.config.ts` includes `base: './'`, which ensures assets load correctly in an offline app environment. (This is already configured in this repo).

Install the necessary Capacitor dependencies:

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
```

Initialize Capacitor with your app information:

```bash
npx cap init DrivePro com.example.drivepro
# Select "npm" as your package manager when prompted.
```

### Step 2: Add Android Platform

Install the Android platform packages:

```bash
npm install @capacitor/android
npx cap add android
```

### Step 3: Build the Web App

Build your React project to generate the static files in `dist/`:

```bash
npm run build
```

### Step 4: Sync with Android

Copy the web assets to the Android project:

```bash
npx cap sync
```

### Step 5: Build APK in Android Studio

Open the Android project in Android Studio:

```bash
npx cap open android
```

1.  Wait for Gradle sync to finish.
2.  Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3.  Once built, transfer the APK to your phone and install it!

> **Note on Google Sign-In**: If you are using the Google Drive features in the APK, the standard web authentication flow may be blocked by Google for security reasons. For a production-ready app, consider using the `@capacitor-community/google-sign-in` plugin and configuring your SHA-1 certificate fingerprint in the Google Cloud Console.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
