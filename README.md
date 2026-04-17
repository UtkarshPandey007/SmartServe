# ⚡ SmartServe — Smart Volunteer Coordination Platform

> Data-driven volunteer coordination for social impact. Built for **GDG Solution Challenge 2026**.

🌐 **Live Demo:** [smart-serve-nine.vercel.app](https://smart-serve-nine.vercel.app)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎯 Problem Statement

Disaster response and community welfare programs face a critical coordination challenge: matching the right volunteers to the right needs at the right time. Manual coordination leads to delays, mismatches, and underutilization of volunteer resources.

## 💡 Solution

**SmartServe** is a real-time, intelligent volunteer coordination platform that:
- Uses an **urgency scoring algorithm** to prioritize community needs
- Provides a **smart matching engine** that pairs volunteers with needs based on skills, location, and availability
- Offers **role-based dashboards** for coordinators and volunteers
- Enables **real-time task tracking** with a Kanban board
- Generates **impact reports** with analytics and leaderboards

---

## ✨ Features

### 🔐 Two User Roles

| Coordinator | Volunteer |
|---|---|
| Report & prioritize community needs | Browse open needs & self-assign |
| Smart volunteer matching engine | Accept/decline assigned tasks |
| Kanban task management | Mark complete & log hours |
| Impact reports & analytics | Personal dashboard & stats |
| Assign volunteers to needs | Edit profile, skills & availability |

### 📊 Priority Intelligence Dashboard
- Real-time urgency scoring (weighted algorithm: urgency × time-decay × frequency × vulnerability × resources)
- Interactive **India heatmap** showing need intensity
- Live KPI cards with trend indicators

### 🤖 Volunteer Matching Engine
- Skills-based matching with compatibility scores
- Location proximity filtering
- Availability overlap detection
- One-click assignment

### 📋 Task Lifecycle Tracking
- Drag-and-drop **Kanban board** (Open → Assigned → In Progress → Completed)
- Persistent state — changes survive page refresh
- Real-time sync across tabs

### 📈 Impact Reports
- Automated KPI computation from live data
- Category and status breakdowns
- Volunteer leaderboard
- Historical trend charts

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8 |
| **Styling** | Vanilla CSS, Glassmorphism design system |
| **Maps** | Leaflet + React-Leaflet |
| **Charts** | Recharts |
| **Auth** | Firebase Authentication (Email + Google) |
| **Database** | Cloud Firestore (real-time subscriptions) |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Auth and Firestore enabled

### 1. Clone & Install

```bash
git clone https://github.com/UtkarshPandey007/SmartServe.git
cd SmartServe
npm install
```

### 2. Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project (e.g., `volunteeriq`)
3. Enable **Authentication** → Email/Password + Google
4. Create **Cloud Firestore** database in test mode

### 3. Configure Environment

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) → Sign up → Database auto-seeds with sample data on first login.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── AutoSeeder.jsx          # Auto-populates DB on first login
│   ├── Dashboard/              # Dashboard-specific styles
│   └── Layout/
│       ├── Header.jsx          # Top bar with user info + role
│       └── Sidebar.jsx         # Role-based navigation
├── context/
│   └── AuthContext.jsx         # Firebase Auth + role management
├── data/
│   ├── needs.js                # 35 mock needs across India
│   ├── volunteers.js           # 20 mock volunteer profiles
│   ├── tasks.js                # 25 mock tasks
│   └── analytics.js            # Historical analytics data
├── firebase/
│   ├── config.js               # Firebase initialization
│   ├── services.js             # Firestore CRUD + real-time subs
│   └── seed.js                 # One-time data migration
├── pages/
│   ├── DashboardPage.jsx       # Priority intelligence dashboard
│   ├── NeedsPage.jsx           # Needs management table
│   ├── SubmitNeedPage.jsx      # Multi-step need reporting form
│   ├── VolunteersPage.jsx      # Matching engine + profiles
│   ├── TasksPage.jsx           # Kanban board
│   ├── ReportsPage.jsx         # Analytics + leaderboard
│   ├── LoginPage.jsx           # Auth with role selector
│   └── volunteer/
│       ├── VolunteerDashboard.jsx  # Personal stats + active tasks
│       ├── MyTasksPage.jsx        # Accept/complete tasks
│       ├── BrowseNeedsPage.jsx    # "I Can Help" self-assign
│       └── MyProfilePage.jsx      # Edit skills & availability
└── App.jsx                     # Role-based routing
```

---

## 🔑 Urgency Scoring Algorithm

Each community need is scored on a 0–100 scale using a weighted algorithm:

```
Score = Urgency Rating (30%)
      + Time Decay (20%)
      + Frequency (25%)
      + Vulnerability Index (15%)
      + Resource Gap (10%)
```

This ensures the most critical needs surface to the top of the dashboard automatically.

---

## 🧑‍💻 Team

**Cloud Catalyst** — GDG Solution Challenge 2026

---

## 📄 License

This project is licensed under the MIT License.
