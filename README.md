# CarCare Pro — Qatar Multi-Branch Workshop Management System

A production-grade, multi-branch car care and auto repair job card management system tailored for automotive workshops in Qatar.

---

## 🌟 Key Features

- **Qatar Localization**:
  - Currency: QAR (`ر.ق`)
  - Timezone: `Asia/Qatar`, Date format: `DD/MM/YYYY`
  - Mobile format: `+974` (8 digits)
  - Customer ID: Qatar ID (`QID` exactly 11 digits) with automatic customer account generation
  - Complete English and Arabic (`dir="rtl"`) layout toggle with Inter and Cairo typography

- **Roles & Access Control**:
  - **Super Admin (Owner)**: Multi-branch monitoring, live Kanban board, job creation, master lookups, and "View as" technician/customer mode.
  - **Branch Admin**: Scoped workshop management for a single branch.
  - **Technician**: Mobile-first stepper (Accept, Pre-Repair 5 Before photos, live labor timer, 10-point quality checklist, 5 After photos, suggestions/safety concerns).
  - **Customer Portal**: QID login, live progress bar, before/after comparison slider, damage blueprint, itemized tax invoice in QAR, and WhatsApp branch link.

- **Lookups with "+" Buttons**:
  - Every single dropdown is searchable with an adjacent `+` button to dynamically create and auto-select options.
  - Integration with the free NHTSA vPIC API with built-in GCC popular models fallback.

- **Completed Jobs & WhatsApp Dispatch**:
  - Instant transition from technician completion to "Ready to Send".
  - Preview customer report, edit discounts/lines, and click "Send via WhatsApp" to open formatted `wa.me` link with prefilled bilingual message.

- **PDF Generation**:
  - In-browser high-resolution A4 PDF download using `jspdf` and `html2canvas` for Job Cards, Completion Reports, and Invoices.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run full-stack development server (Express + Vite)
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 🔐 Firebase Configuration & Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Cloud Storage**.
3. Create a Web App in Firebase and copy credentials to `.env`:

```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
```

4. Deploy Firestore and Storage security rules:
```bash
firebase deploy --only firestore:rules,storage:rules,firestore:indexes
```

---

## 🐳 Docker & Google Cloud Run Deployment

Build and deploy to Google Cloud Run:

```bash
# Build Docker image
docker build -t gcr.io/[PROJECT-ID]/carcare-pro:latest .

# Push to Google Container Registry
docker push gcr.io/[PROJECT-ID]/carcare-pro:latest

# Deploy to Cloud Run
gcloud run deploy carcare-pro \
  --image gcr.io/[PROJECT-ID]/carcare-pro:latest \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --port 3000
```

---

## 📋 Pre-Launch Verification Checklist

1. **Admin creates Job Card**: Enters 11-digit QID, vehicle details, drops damage pins on 4 views, signs estimate.
2. **Technician workflow**: Logs in on mobile, accepts job, starts labor timer, uploads 5 before photos and odometer/fuel photo, completes repair, uploads 5 after photos, ticks 10-point checklist.
3. **Admin review**: Opens **Completed Jobs**, reviews before/after comparison, adjusts discounts, clicks **Send via WhatsApp**.
4. **Customer portal**: Logs in with QID, views inspection report, interacts with Before/After slider, views itemized invoice, and downloads PDF.
