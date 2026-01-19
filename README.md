# 📦 Packigo - Intelligent Logistics Platform

Packigo is a real-time logistics management solution designed to streamline moving and packing operations. It features a dual-interface system: a client portal for booking and tracking moves, and a powerful admin dashboard for fleet management, live operations monitoring, and analytics.

---

## 🚀 Features at a Glance

### 👑 Admin Command Center
- **Live Operations Feed:** Real-time updates for new bookings and status changes via Socket.IO.
- **Fleet Management:** Monitor vehicle availability and maintenance status instantly.
- **Smart Analytics:**
    - **Retention Rate:** Automatically tracks repeat customers.
    - **Route Intelligence:** Identifies top performing routes.
    - **Revenue Tracking:** Live financial insights.
- **System Controls:** Maintenance mode, registration toggles, and automated invoicing simulation.

### 👤 Client Portal
- **Instant Estimates:** Price calculator based on move size and distance.
- **Real-Time Tracking:** Watch booking status change from Pending to Confirmed to In-Transit live.
- **Secure Access:** Powered by Firebase Authentication.

---

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3 (Glassmorphism UI), Vanilla JS
- **Backend:** Node.js, Express.js
- **Real-Time Engine:** Socket.IO
- **Database:** Firebase Realtime Database
- **Auth:** Firebase Authentication

---

## ⚙️ Setup & Deployment

### Local Development
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/GSriCharan12/Packigo.git
    cd Packigo
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Firebase:**
    - Place your `serviceAccountKey.json` in the root directory.
    - Update the Firebase config in `public/client-signup.html` and `client-login.html`.
4.  **Run the server:**
    ```bash
    npm start
    ```
    Visit `http://localhost:3000`

### ☁️ Deployment on Railway.app
This project is configured for one-click deployment on Railway.

1.  **Fork/Clone** this repo to your GitHub.
2.  **New Project** on Railway -> Deploy from GitHub.
3.  **Add Environment Variable:**
    - Name: `FIREBASE_SERVICE_ACCOUNT`
    - Value: Paste the *content* of your `serviceAccountKey.json`.
4.  **Deploy!** Railway will detect the start script automatically.

---

## 🤝 Contributing
Contributions are welcome! Please read `CONTRIBUTING.md` for details on our code of conduct and the process for submitting pull requests.
