# LifePilot AI — Firebase Google Login & Cloud Sync Setup Guide (₹0 Spark Tier)

This guide walks you through setting up **Google Sign-In** and **Cloud Firestore Real-Time Synchronization** for LifePilot AI completely free of charge using Firebase's **Spark Plan (₹0 / No Cost)**.

---

## Strict ₹0 Budget Guarantee

- **No credit card required**: The Firebase Spark plan never asks for billing or credit card details.
- **Google Sign-In**: 100% free with unlimited accounts.
- **Cloud Firestore**:
  - **1 GiB** stored data (Free)
  - **50,000 document reads / day** (Free)
  - **20,000 document writes / day** (Free)
  - **20,000 document deletes / day** (Free)
  - **10 GiB network egress / month** (Free)
- **Hard Stop**: If you ever exceed the free daily writes or reads, Firebase returns a soft `resource-exhausted` limit error. The app automatically catches this and continues saving to local storage. You will never be billed. Quotas reset every 24 hours at midnight Pacific Time.

---

## Step 1: Create a Free Firebase Project

1. Open your browser and visit the [Firebase Console](https://console.firebase.google.com/).
2. Sign in with your standard Google / Gmail account.
3. Click **"Add project"** (or **"Create a project"**).
4. Enter a project name, e.g. `lifepilot-ai`.
5. Google Analytics is optional; you can uncheck it to keep things simple.
6. Click **"Create project"** and wait a few seconds.
7. Confirm that your project is on the **Spark Plan (Free / ₹0)** (shown in the bottom left corner).

---

## Step 2: Register Your Web App

1. On the Firebase Project Overview page, click the **Web icon (`</>`)** to add a web application.
2. Enter an app nickname, e.g. `LifePilot Web`.
3. Leave *"Also set up Firebase Hosting"* **unchecked** (not required).
4. Click **"Register app"**.
5. Firebase will display your `firebaseConfig` snippet. Keep this open or copy the values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## Step 3: Enable Google Authentication & Authorize Your Live Domain

1. In the Firebase Console left navigation sidebar, go to **Build → Authentication**.
2. Click **"Get started"**.
3. Under the **Sign-in method** tab, click **Google**.
4. Switch the **Enable** toggle to **ON**.
5. Select your email address under **Project support email**.
6. Click **"Save"**.
7. In the same Authentication section, switch to the **Settings** tab at the top.
8. Click **Authorized domains**.
9. Click **"Add domain"** and add your live Render production domain:
   - **`lifepilot-ai-dgnw.onrender.com`** (enter exact domain without `https://`)
   - Verify that **`localhost`** is also in the list.
   > **CRITICAL**: If `lifepilot-ai-dgnw.onrender.com` is not in the Authorized domains list, Google Sign-In will be rejected by Firebase with `auth/unauthorized-domain`.

---

## Step 4: Create Cloud Firestore Database

1. In the left navigation sidebar, go to **Build → Firestore Database**.
2. Click **"Create database"**.
3. Choose a database location closest to you (e.g. `asia-south1` Mumbai).
4. Select **"Start in production mode"** (we will apply custom security rules in the next step).
5. Click **"Create"**.

---

## Step 5: Apply Restrictive Firestore Security Rules

1. In the Firestore Database page, click the **Rules** tab at the top.
2. Replace all existing text with the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restrict access so only the authenticated user can access their own workspace data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**.
4. **Why this is secure**: `request.auth.uid == userId` guarantees that no user can ever read, modify, or delete another user's private tasks, goals, or notes.

---

## Step 6: Configure Local Environment Variables

Open your existing `.env` file in `D:\abhis_data\LifePilot-AI\.env` and add your Firebase credentials:

```bash
# Keep your existing Gemini API key untouched
GEMINI_API_KEY=your_existing_gemini_api_key

# Firebase Client Configuration (from Step 2)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=lifepilot-ai-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lifepilot-ai-xxxx
VITE_FIREBASE_STORAGE_BUCKET=lifepilot-ai-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

> **Security Note**: Never commit `.env` to GitHub. The Vite environment variables (`VITE_FIREBASE_*`) are public client configuration keys used to connect to your Firebase project; security is strictly enforced by the Firestore Security Rules you published in Step 5.

---

## Step 7: How to Test Google Login & Sync on Laptop

1. Start the LifePilot AI server:
   ```powershell
   npm.cmd start
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
3. Click the **"Google Sign-In"** button in the header or in **Settings**.
4. A Google login popup will open. Select your Google / Gmail account.
5. Once signed in:
   - Your name and Google profile avatar will appear in the top header and sidebar.
   - The status pill will display **"Cloud Synced"**.
   - If you had existing tasks on your device, the **Migration Dialog** will ask whether you want to **Merge Both** or **Upload Local Data**.
   - An automatic local backup is saved in `localStorage` under `lifepilot_backup_pre_sync`.

---

## Step 8: How to Test Across Laptop & Android Phone (₹0 / Without Paid Hosting)

Because Android Chrome strictly requires **HTTPS** (or `localhost`) for Google OAuth popups and PWA installation:

### Option A: USB Cable Remote Port-Forwarding (Recommended for Local Dev)
1. Connect your Android phone to your laptop using a USB cable (enable USB Debugging in Developer Options).
2. On your laptop's Chrome browser, open:
   ```
   chrome://inspect/#devices
   ```
3. Under **Port forwarding**, click **Add rule**:
   - Port: `3000`
   - IP address and port: `localhost:3000`
   - Check **"Enable port forwarding"**.
4. On your phone's Chrome, go to:
   ```
   http://localhost:3000
   ```
   *(Android treats `localhost` as a secure context!)*
5. Sign in with the **same Google account** on both your laptop and phone.
6. Add or complete a task on your phone — watch it update on your laptop in real time!

### Option B: Free Cloudflare Tunnel or ngrok (Wireless across Wi-Fi)
1. Run a free HTTPS tunnel on your laptop:
   ```powershell
   # Using Cloudflare Tunnel (no account required)
   npx cloudflared tunnel --url http://localhost:3000
   ```
2. Cloudflare gives you a temporary `https://random-name.trycloudflare.com` URL.
3. In Firebase Console → **Authentication → Settings → Authorized domains**, add `trycloudflare.com` (or your ngrok domain).
4. Open the `https://...` link on your Android phone and sign in.

---

## Summary of Free Quotas & Behavior

| Metric | Free Allowance | What Happens if Limit Reached |
| :--- | :--- | :--- |
| **Google Sign-In** | Unlimited | No limit |
| **Firestore Writes** | 20,000 writes / day | Operations pause until next day; local storage continues saving |
| **Firestore Reads** | 50,000 reads / day | Operations pause until next day; local storage continues saving |
| **Stored Workspace** | 1 GiB | LifePilot workspace is < 2 MB, using < 0.2% of allowance |
| **Billing Risk** | ₹0.00 | Impossible to be billed without linking a billing account |

