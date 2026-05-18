# ◈ Calculator - LueurTech

A premium, futuristic, and highly immersive calculator application designed for LueurTech. This app features a stunning dual-theme interface, 3D button depth, smooth animations, and a rich user experience wrapped into a lightweight, zero-dependency codebase.

It is built as a progressive web app and packaged natively for Android using Capacitor.

---

## ✨ Features

- **Basic Operations:** Add, Subtract, Multiply, Divide, Percentage, Decimal, Clear (AC), Backspace.
- **Dual Theme Engine:** 
  - *Dark Mode:* Deep immersive purple-black with glowing ambient orbs and floating 3D buttons.
  - *Light Mode:* Frosted white glassmorphism with soft shadows and elegant accents.
- **Fluid Animations:** Morphing number transitions, sliding text, ripple effects on tap, and dynamic font scaling.
- **Haptic & Audio Feedback:** Integrated vibration and Web Audio API tones for a satisfying, tactile feel (toggleable).
- **History Panel:** Slide-in panel to view past calculations, with tap-to-reuse functionality.
- **Clipboard Support:** One-tap copy of the current result with a smooth toast notification.
- **Edge-to-Edge Android Support:** Specifically designed to render flawlessly behind notch/punch-hole cameras using native safe-area insets.
- **Zero Dependencies:** Pure HTML5, CSS3, and Vanilla JavaScript. Ultra-lightweight (under 30KB).

---

## 🚀 Tech Stack

- **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox/Grid, Animations), Vanilla JavaScript (ES6+).
- **Native Wrapper:** [Capacitor](https://capacitorjs.com/) by Ionic.
- **Plugins Used:** `@capacitor/status-bar` for edge-to-edge transparent overlay.

---

## 🛠️ Local Development (Web)

To run the web version of the calculator locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/Diwakar-Pratap/LueurTech-Calculator.git
   cd LueurTech-Calculator
   ```
2. Run a local HTTP server:
   ```bash
   npx http-server ./www -p 8090 -c-1
   ```
3. Open `http://localhost:8090` in your browser.

*(Note: The core source files are `index.html`, `style.css`, and `script.js` located in both the root folder and the `www` directory).*

---

## 📱 Android Development (Capacitor)

This app is pre-configured to run as a native Android application using Capacitor. 

### Prerequisites
- Node.js (v18+)
- Android Studio with Android SDK 34
- Java JDK 17

### 1. Install Dependencies
```bash
npm install
```

### 2. Sync Web Assets to Android
Whenever you make changes to the HTML/CSS/JS files inside the `www` folder, you must sync them to the Android project:
```bash
npx cap sync android
```

### 3. Open in Android Studio
Launch the project in Android Studio to build, test on an emulator, or deploy to a physical device:
```bash
npx cap open android
```

---

## 📦 Building for Release (Google Play Store)

To generate a signed App Bundle (`.aab`) for the Google Play Store:

1. Open the project in Android Studio (`npx cap open android`).
2. Ensure you have created a signing keystore (`.jks`).
3. In the menu, go to **Build > Generate Signed Bundle / APK...**
4. Select **Android App Bundle**, provide your keystore credentials, and select the `release` build variant.
5. The output `app-release.aab` can be directly uploaded to the Google Play Console.

---

## 📄 License

Created by **LueurTech**. All rights reserved.
