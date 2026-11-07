# Musa Mobile Repairing Center (موسی موبائل ریپیئرنگ سنٹر)

[![GitHub Release](https://img.shields.io/github/v/release/citymobile81-lgtm/Musa-Mobile-apk?color=gold&label=Release)](https://github.com/citymobile81-lgtm/Musa-Mobile-apk/releases)
[![Repository](https://img.shields.io/badge/GitHub-citymobile81--lgtm%2FMusa--Mobile--apk-blue?logo=github)](https://github.com/citymobile81-lgtm/Musa-Mobile-apk)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-emerald?logo=pwa)](https://github.com/citymobile81-lgtm/Musa-Mobile-apk)

Professional, modern, responsive mobile phone repairing laboratory and shop management system built with React 19, TypeScript, Vite, and Tailwind CSS.

---

## 🏢 Shop Information / دکان کی تفصیلات

- **Shop Name**: Musa Mobile Repairing Center (موسی موبائل ریپیئرنگ سنٹر)
- **Location**: واٹر پلانٹ، نزد قبا آپٹیکل، مظفرگڑھ سٹی (Water Plant, Near Quba Optical, Muzaffargarh City)
- **Proprietor / پروپرائیٹر**: میاں محمد محسن قریشی (`03006861765`)
- **Chief Lab Engineer / چیف لیب انجینئر**: میاں اظہر قریشی (`03216861765`)

---

## ✨ Key Features / اہم خصوصیات

1. **6 Professional Themes (پریمیئم تھیمز)**:
   - **Theme 1**: Premium Black & Gold Luxury
   - **Theme 2**: Royal Blue & White
   - **Theme 3**: Multi-Color Gradient
   - **Theme 4**: Dark Neon Cyber
   - **Theme 5**: Green & Black Luxury
   - **Theme 6**: **Premium Pure White Theme** (مکمل سفید، شاہانہ نیوی بلیو و گولڈن تفصیلات)
2. **Smart Customer Auto Search (اسمارٹ آٹو سرچ)**:
   - Real-time instant search across customer name (2-3 letters), phone number, last 4 digits of IMEI, and device model.
3. **Repair Job Cards & Visual Progress (جاب کارڈز و پروگریس بار)**:
   - Comprehensive intake, fault checklists, completion percentages, technician assignment, and delivery handovers.
4. **Thermal Receipt Printing & PDF Export (رسید و پرنٹ)**:
   - 80mm POS thermal receipt generation with QR code and shop verification.
5. **Accounting & Customer Udhar Khata (کھاتہ بقایا جات)**:
   - Track advance payments, outstanding balances, payment logs, and automatic debt reminders.
6. **Spare Parts Inventory & Low Stock Alerts (اسپیئر پارٹس اسٹاک)**:
   - Real-time catalog with minimum threshold warnings.
7. **Automated Offline PWA & ZIP Backups (بیک اپ و ریسٹور)**:
   - One-click snapshot backups and restoration.
8. **Bilingual Support (اردو و انگریزی)**:
   - Seamless toggling between Urdu (RTL with Nastaliq font) and English.

---

## 🚀 How to Publish / Push to GitHub

To push this codebase to your repository `citymobile81-lgtm/Musa-Mobile-apk`:

```bash
# 1. Initialize local git repository
git init

# 2. Add all files
git add .

# 3. Create the initial commit
git commit -m "feat: Initial release v2.0.0 for Musa Mobile Repairing Center"

# 4. Set main branch
git branch -M main

# 5. Link to your GitHub repository
git remote add origin https://github.com/citymobile81-lgtm/Musa-Mobile-apk.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🏷️ Releasing a Version

To trigger the automated GitHub Actions build and release packaging:

```bash
# Create and push a version tag
git tag v2.0.0
git push origin v2.0.0
```

GitHub Actions will automatically:
1. Run TypeScript type checks and linting.
2. Build the production application bundle.
3. Package `.zip` and `.tar.gz` distribution packages.
4. Create a tagged release at `https://github.com/citymobile81-lgtm/Musa-Mobile-apk/releases`.

---

## 📱 Native Android Project (Capacitor)

The repository contains a complete, production-ready native Android project in the `android/` directory:

- **Framework**: Capacitor 7 (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`)
- **Package Name**: `com.musamobile.repairing`
- **Min SDK**: 24 (Android 7.0 Nougat)
- **Target / Compile SDK**: 36 (Android 15)
- **Signing**: Configured for Release Signing Keystore with fallback to debug.

### 🤖 Automatic GitHub Actions Build:
Whenever you push to `main` or push a release tag (`v2.0.0`), GitHub Actions:
1. Compiles the TypeScript/Vite web application.
2. Syncs web assets into `android/app/src/main/assets/public/`.
3. Runs `./gradlew assembleRelease` to compile Dalvik bytecode (`classes.dex`), binary XML (`AndroidManifest.xml`), and `resources.arsc`.
4. Saves the signed APK in **GitHub Actions Artifacts** under **`Musa-Mobile-Release-APK`** (free direct download from GitHub).
5. Attaches the signed APK directly to **GitHub Releases**.

### 💻 Local Android Studio / CLI Build:
```bash
# Build web assets and sync to native Android
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android

# Or build release APK via Gradle command line
cd android
./gradlew assembleRelease
```

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```
