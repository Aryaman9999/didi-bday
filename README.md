# 🎂 Dr. Nitishikha Sharma · Birthday Countdown Album & Scrapbook

A warm, graceful birthday countdown website crafted for **Dr. Nitishikha Sharma** — dentist, YMCA yoga teacher, and beloved Didi.

From Delhi and Chandigarh to Sydney, Nova Scotia, this website celebrates her journey across **15 daily memories** leading up to her birthday on **November 4th**, featuring an advent-style automatic daily unlock, interactive polaroid scrapbook layout, custom guestbook, and a grand **Birthday Memory Reel** slideshow with exclusive celebration memories!

---

## 🌟 Key Highlights & Features

1. **Photo Album Scrapbook Aesthetic**:
   - Polaroid-style cards with authentic gentle tilts and washi-tape accents.
   - Elegant color palette: Warm cream (`#FDF6E3`), vintage gold (`#C4974A`), and rich espresso brown (`#3D2B1A`).
   - Google Fonts: *Playfair Display* (classic serif), *Caveat* (warm handwriting), and *Lato* (clean body).
2. **Automatic Date-Based Unlock**:
   - **Launch Date**: October 21 (Day 1) → **Birthday**: November 4 (Day 15).
   - Each day, a new memory blooms open automatically.
   - Future days are tastefully locked with a wax-seal medallion and reveal the exact opening date (e.g. *"Opens Oct 24"*).
   - "Today's Memory" is spotlighted with a golden border and badge.
3. **Birthday Celebration & Reel Mode (Nov 4)**:
   - On November 4th, the site blossoms with celebratory confetti.
   - 3 Exclusive Birthday memories are unlocked.
   - **▶ Play Your Birthday Memory Reel**: An interactive fullscreen slideshow walking through all 15 memories, the 3 exclusives, and a heartfelt grand finale greeting.
4. **Scrapbook Guestbook**:
   - Family & friends can pin pastel sticky notes with warm birthday wishes.
   - Seamless dual-mode: Works out-of-the-box with local storage, and connects to Cloud Firebase Firestore in minutes if desired.
5. **Local Admin & Photo Uploader**:
   - A built-in local Node.js + Express panel at `http://localhost:3001/admin/`.
   - Easily upload photos, edit titles and stories, and preview without touching raw code.
6. **GitHub Pages Ready**:
   - Pre-configured GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and hosts the static site for free.

---

## 🚀 Quick Start (Local Admin & Photo Upload)

You can run the built-in local admin server to upload your photos and customize stories:

1. Open your terminal in this directory:
   ```bash
   cd api
   npm install
   npm start
   ```
2. Open your browser:
   - **Admin & Photo Uploader**: [http://localhost:3001/admin/](http://localhost:3001/admin/)
   - **Live Website**: [http://localhost:3001/](http://localhost:3001/)

From the Admin panel, you can click **"📷 Choose Photo"** for each of the 15 days, edit the text, and hit **"Save Memory"**.

---

## 🔍 Previewing & Testing Different Dates

You don't need to wait until Oct 21 or change your computer's clock to test the site!

- **Unlock All Memories (Preview Mode)**:  
  `http://localhost:3001/?unlockAll=true`
- **Simulate Specific Date** (e.g., Oct 25):  
  `http://localhost:3001/?simulateDate=2026-10-25`
- **Simulate November 4th Birthday (Full Confetti & Reel)**:  
  `http://localhost:3001/?simulateDate=2026-11-04&bday=true`

---

## 🌐 Deploying to GitHub Pages (Free Hosting)

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Dr. Nitishikha's Birthday website"
   ```

2. **Create a GitHub Repository**:
   - Go to [GitHub.com/new](https://github.com/new) and create a repository (e.g. `nitishikha-bday`).
   - Link your local repo:
     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/nitishikha-bday.git
     git branch -M main
     git push -u origin main
     ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub → **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
   - The `.github/workflows/deploy.yml` workflow will automatically deploy your site! Your link will be:  
     `https://YOUR_USERNAME.github.io/nitishikha-bday/`

---

## 💌 (Optional) Connecting Firebase to Guestbook

The guestbook already functions locally right away! If you want friends & family around the world to see everyone's wishes in real time:

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a free project.
2. In the project overview, click the **Web icon (`</>`)** to register a web app.
3. Open `assets/js/config.js` in this project and paste your keys into `FIREBASE_CONFIG`:
   ```javascript
   const FIREBASE_CONFIG = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
4. In Firebase Console, go to **Build** → **Firestore Database** → **Create database** (start in Test mode so friends can write wishes).

---

## 📁 Project Structure

```
Bday/
├── index.html                   # Main public website
├── memories.json                # All memory titles, stories, dates & image paths
├── assets/
│   ├── css/
│   │   └── style.css            # Scrapbook polaroid styling & animations
│   ├── js/
│   │   ├── config.js            # Firebase configuration & fallbacks
│   │   └── main.js              # Countdown logic, modals, reel mode, guestbook
│   └── images/
│       └── memories/            # Uploaded photos stored here
├── admin/
│   └── index.html               # Visual photo uploader & story editor
├── api/
│   ├── package.json             # Express + Multer dependencies
│   └── server.js                # Local API for uploading photos & git push
└── .github/
    └── workflows/
        └── deploy.yml           # GitHub Pages auto-deploy workflow
```

Made with love · From CHD, all the way to Nova Scotia 💛
