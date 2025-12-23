<p align="center">
  <img src="https://img.icons8.com/3d-fluency/94/calendar.png" alt="CalManage Logo" width="120" height="120"/>
</p>

<h1 align="center">📅 CalManage</h1>

<p align="center">
  <strong>A Modern, Full-Stack Calendar Management Application</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"/>
  <img src="https://img.shields.io/badge/status-active-success.svg?style=flat-square" alt="Status"/>
</p>

---

## 🌟 Overview

**CalManage** is a feature-rich, production-ready calendar management application that enables users to organize their schedules, collaborate with teams, and stay on top of their tasks. Built with a modern tech stack featuring React, Node.js, and MongoDB, it offers a sleek glassmorphism UI with dark mode aesthetics.

Whether you're managing personal appointments, coordinating team meetings, or sharing calendars with family members — CalManage has you covered.

---

## ✨ Features

### 📆 Calendar Management
- **Multi-View Calendar** — Switch between Day, Week, Month, and Year views
- **Multiple Calendars** — Create and manage unlimited calendars with custom colors
- **Default Calendar** — Auto-created "Personal" calendar for quick start
- **Event Aggregation** — View events from all calendars in a unified interface

### 📝 Event Management
- **Full CRUD Operations** — Create, read, update, and delete events
- **Rich Event Details** — Title, description, location, participants, and more
- **All-Day Events** — Support for full-day events
- **Reminders** — Set custom reminders for important events
- **Recurrence** — Support for recurring events

### 👥 Collaboration & Sharing
- **Calendar Sharing** — Share calendars with other users via email
- **Role-Based Access** — Assign `viewer` or `editor` roles to shared users
- **Invite System** — Accept or decline calendar invitations
- **Pending Invites Dashboard** — View and manage all sharing invitations
- **Email Invites** — Invite unregistered users via email invitation

### 🔔 Notifications & Activity
- **Real-Time Notifications** — In-app notification system with unread counts
- **Activity Feed** — Recent activity log from the last 48 hours
- **Reminder Notifications** — Automated reminders for upcoming events
- **Event Change Alerts** — Get notified when shared calendars are updated

### ✅ Task Management
- **Quick Tasks** — Create and manage simple to-do items
- **Completion Tracking** — Mark tasks as complete with activity logging
- **Dashboard Integration** — View tasks alongside your calendar

### 🔐 Authentication & Security
- **JWT Authentication** — Secure token-based authentication
- **Password Reset** — Email-based password recovery flow
- **Protected Routes** — Secure API endpoints with middleware
- **Role Verification** — Access control for shared resources

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI library with modern hooks |
| **Vite 7** | Lightning-fast build tool |
| **Tailwind CSS 3** | Utility-first styling |
| **React Router 7** | Client-side routing |
| **Framer Motion** | Smooth animations |
| **Lucide React** | Beautiful icon library |
| **date-fns** | Date manipulation |
| **Three.js** | 3D graphics (landing page) |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express 4** | Web framework |
| **Mongoose 9** | MongoDB ODM |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing |
| **node-cron** | Background job scheduling |
| **Nodemailer** | Email delivery |

### Database
| Technology | Purpose |
|------------|---------|
| **MongoDB** | NoSQL document database |

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         Browser                                │
│                    React + Vite + Tailwind                     │
│              (AuthContext + CalendarContext)                   │
└─────────────────────────┬─────────────────────────────────────┘
                          │ HTTP/JSON
                          │ Authorization: Bearer <JWT>
                          ▼
┌───────────────────────────────────────────────────────────────┐
│                    Node.js / Express                           │
│           Routes → Controllers → Models                        │
│              + Background Reminder Job                         │
└─────────────────────────┬─────────────────────────────────────┘
                          │ Mongoose ODM
                          ▼
┌───────────────────────────────────────────────────────────────┐
│                        MongoDB                                 │
│     Users • Calendars • Events • Shares • Notifications       │
└───────────────────────────────────────────────────────────────┘
                          │ SMTP
                          ▼
┌───────────────────────────────────────────────────────────────┐
│                     Email Provider                             │
│            (SMTP Server / Ethereal for dev)                    │
└───────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Calendar/
├── 📂 backend/
│   ├── 📂 src/
│   │   ├── 📂 config/          # Database configuration
│   │   │   └── db.js           # MongoDB connection
│   │   ├── 📂 controllers/     # Business logic
│   │   │   ├── authController.js
│   │   │   ├── calendarController.js
│   │   │   ├── eventController.js
│   │   │   ├── shareController.js
│   │   │   ├── taskController.js
│   │   │   ├── notificationController.js
│   │   │   └── activityController.js
│   │   ├── 📂 jobs/            # Background tasks
│   │   │   └── reminderJob.js  # Cron job for reminders
│   │   ├── 📂 middleware/      # Express middleware
│   │   │   └── authMiddleware.js
│   │   ├── 📂 models/          # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Calendar.js
│   │   │   ├── Event.js
│   │   │   ├── CalendarShare.js
│   │   │   ├── PendingShare.js
│   │   │   ├── Task.js
│   │   │   ├── Notification.js
│   │   │   └── Activity.js
│   │   ├── 📂 routes/          # API route definitions
│   │   ├── 📂 utils/           # Helper utilities
│   │   │   └── emailService.js
│   │   └── server.js           # App entry point
│   ├── .env_example            # Environment template
│   └── package.json
│
└── 📂 frontend/
    ├── 📂 src/
    │   ├── 📂 components/
    │   │   ├── 📂 Calendar/     # Calendar view components
    │   │   ├── 📂 Layout/       # App shell & navigation
    │   │   └── 📂 Modals/       # Modal dialogs
    │   ├── 📂 context/          # React Context providers
    │   │   ├── AuthContext.jsx
    │   │   └── CalendarContext.jsx
    │   ├── 📂 pages/            # Route pages
    │   │   ├── Dashboard.jsx
    │   │   ├── CalendarPage.jsx
    │   │   ├── TasksPage.jsx
    │   │   ├── SettingsPage.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── 📂 utils/            # Utility functions
    │   ├── App.jsx              # Root component
    │   └── main.jsx             # Entry point
    ├── 📂 tests/                # Test files
    ├── vite.config.js           # Vite configuration
    ├── tailwind.config.js       # Tailwind configuration
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/project-team/calmanage.git
cd calmanage
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env_example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/calmanage
JWT_SECRET=your_super_secret_jwt_key_here

# Optional: SMTP for emails (uses Ethereal test accounts if not set)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
SMTP_SECURE=false
EMAIL_FROM="CalManage <noreply@calmanage.com>"
```

Start the backend server:

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

### 3. Frontend Setup

```bash
# Navigate to frontend (from root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password |

### Calendars

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calendars` | List user's calendars |
| `POST` | `/api/calendars` | Create new calendar |
| `PATCH` | `/api/calendars/:id` | Update calendar |
| `DELETE` | `/api/calendars/:id` | Delete calendar |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calendars/:calendarId/events` | List events |
| `POST` | `/api/calendars/:calendarId/events` | Create event |
| `GET` | `/api/events/:id` | Get single event |
| `PATCH` | `/api/events/:id` | Update event |
| `DELETE` | `/api/events/:id` | Delete event |

### Sharing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/shares` | Share a calendar |
| `GET` | `/api/shares` | Get shared calendars |
| `GET` | `/api/shares/invites` | Get pending invites |
| `PATCH` | `/api/shares/invites/:id` | Accept/decline invite |
| `DELETE` | `/api/shares/:shareId` | Remove share |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List tasks |
| `POST` | `/api/tasks` | Create task |
| `PATCH` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | List notifications |
| `PATCH` | `/api/notifications/:id/read` | Mark as read |
| `DELETE` | `/api/notifications/:id` | Delete notification |
| `DELETE` | `/api/notifications` | Clear all |

### Activity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activity` | Recent activity feed |

---

## 📸 Screenshots

<p align="center">
  <em>Dashboard with today's schedule, pending invites, and activity feed</em>
</p>

<p align="center">
  <em>Multi-view calendar with day, week, month, and year views</em>
</p>

<p align="center">
  <em>Calendar sharing with role-based access control</em>
</p>

---

## 🧪 Testing

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Lint code
npm run lint
```

### Test Coverage

- Color utility functions (HSL-to-hex conversion)
- Event layout calculations
- Component rendering tests

---

## 📦 Build & Deployment

### Build for Production

```bash
# Frontend build
cd frontend
npm run build
# Output: frontend/dist/

# Backend (no build step required)
cd backend
npm start
```

### Deployment Checklist

- [ ] Set up MongoDB (Atlas recommended for production)
- [ ] Configure environment variables
- [ ] Update CORS origins for production domain
- [ ] Update hard-coded URLs (password reset, invites)
- [ ] Set up SMTP for email delivery
- [ ] Configure reverse proxy (Nginx) for frontend static files
- [ ] Use PM2 or similar for Node.js process management
- [ ] Enable HTTPS

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Backend port (default: 5000) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret for JWT signing |
| `SMTP_HOST` | No | SMTP server host |
| `SMTP_PORT` | No | SMTP server port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_SECURE` | No | Use TLS (true/false) |
| `EMAIL_FROM` | No | Default sender address |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 🗺️ Roadmap

- [ ] **Backend test suite** — Unit and integration tests with CI/CD
- [ ] **Unified API layer** — Centralized fetch helpers in frontend
- [ ] **Enhanced reminders** — Email reminders and shared calendar support
- [ ] **Range-based queries** — Optimized event fetching
- [ ] **Recurring events UI** — Full recurrence editing support
- [ ] **Role-aware UI** — Hide actions based on user permissions
- [ ] **Mobile app** — React Native companion app
- [ ] **Calendar sync** — Google Calendar / Outlook integration
- [ ] **Dark/Light mode toggle** — Theme switcher

---

## 🐛 Troubleshooting

<details>
<summary><b>Frontend can't reach backend</b></summary>

- Ensure backend is running on `http://localhost:5000`
- Check Vite proxy configuration in `vite.config.js`
- Verify no firewall blocking the ports
</details>

<details>
<summary><b>401 Unauthorized errors</b></summary>

- Token may be expired — try logging in again
- Verify `JWT_SECRET` matches across restarts
- Check `Authorization` header format: `Bearer <token>`
</details>

<details>
<summary><b>MongoDB connection fails</b></summary>

- Confirm `MONGO_URI` is set correctly in `.env`
- Check MongoDB service is running
- For Atlas, verify IP whitelist settings
</details>

<details>
<summary><b>Emails not sending</b></summary>

- Without SMTP config, app uses Ethereal (check console for preview URLs)
- Verify all `SMTP_*` environment variables
- Check SMTP credentials and server settings
</details>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---



<p align="center">
  <b>⭐ If you found this project helpful, please give it a star! ⭐</b>
</p>

<p align="center">
  Made with ❤️ and lots of ☕
</p>
