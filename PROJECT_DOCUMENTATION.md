# CalManage (Calendar) — Project Documentation

## 1. Project Overview

### Purpose & Objectives

CalManage is a full-stack calendar management application that provides personal and shared calendars, event creation, lightweight task tracking, and notification-driven collaboration.

Primary objectives:

- Provide a simple, multi-view calendar (day/week/month/year) for planning.
- Support calendar sharing with roles (viewer/editor) and invite acceptance.
- Offer reminders and notifications for key actions (events, invites, reminders).
- Include basic productivity tooling (tasks + recent activity).

### Key Features

- **Authentication & session**
  - User registration and login with JWT-based authentication.
  - Password reset via email (token-based).
  - Authenticated user profile retrieval.
- **Calendars**
  - Create calendars; ensure a default “Personal” calendar exists.
  - View owned calendars and calendars shared with you.
  - Per-calendar color assignment stored in browser local storage.
- **Events**
  - Create, list, update, delete events.
  - Multi-calendar event creation from the UI (creates one event per target calendar).
  - Basic participant and reminder fields in the data model.
- **Sharing**
  - Invite registered users (in-app invites) or unregistered users (email invite).
  - Accept/decline calendar invites.
  - Role-based permissions for shared calendars (viewer/editor).
- **Notifications**
  - In-app notification list, unread count, mark-as-read, delete, clear-all.
  - Automatic notifications for event creation and reminders.
- **Tasks**
  - Create/complete/delete tasks.
  - Completion logs an activity entry.
- **Activity**
  - Recent activity feed for last 2 days (max 20 entries).
- **Background reminders**
  - A scheduled job checks upcoming events and creates reminder notifications.

### Target Audience & Use Cases

- **Individuals** managing schedules across multiple calendars (work/personal/projects).
- **Small teams/families** sharing calendars with different access levels.
- **Use cases**
  - Create and track daily events and tasks.
  - Share a calendar with a collaborator as a viewer or editor.
  - Receive reminders and see in-app notifications for recent actions.

---

## 2. File Structure

### Directory Tree (High Level)

```text
Calendar/
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  │  └─ db.js
│  │  ├─ controllers/
│  │  ├─ jobs/
│  │  ├─ middleware/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ utils/
│  │  └─ server.js
│  ├─ .env
│  ├─ .env_example
│  ├─ package.json
│  └─ package-lock.json
└─ frontend/
   ├─ src/
   │  ├─ components/
   │  ├─ context/
   │  ├─ pages/
   │  ├─ utils/
   │  ├─ App.jsx
   │  └─ main.jsx
   ├─ tests/
   ├─ vite.config.js
   ├─ package.json
   ├─ index.html
   └─ dist/ (build output)
```

### Backend (`backend/`) — Purpose & Key Files

- `backend/src/server.js`: Express app bootstrap, middleware, route mounting, and reminder job start (`backend/src/server.js:1`).
- `backend/src/config/db.js`: Connects to MongoDB using `MONGO_URI` (`backend/src/config/db.js:1`).
- `backend/src/middleware/authMiddleware.js`: JWT verification and `req.user` population for protected routes (`backend/src/middleware/authMiddleware.js:4`).
- `backend/src/models/*`: Mongoose schemas for core domain objects (users, calendars, events, shares, etc.).
- `backend/src/routes/*`: Express routers mapping URLs to controller actions.
- `backend/src/controllers/*`: Business logic for each feature area.
- `backend/src/jobs/reminderJob.js`: Cron-like job that creates reminder notifications every minute (`backend/src/jobs/reminderJob.js:7`).
- `backend/src/utils/emailService.js`: SMTP/Ethereal email sender used for invites and password reset emails (`backend/src/utils/emailService.js:3`).
- `backend/.env_example`: Template for environment variables required by the backend.

### Frontend (`frontend/`) — Purpose & Key Files

- `frontend/src/main.jsx`: React app bootstrap with `BrowserRouter` (`frontend/src/main.jsx:1`).
- `frontend/src/App.jsx`: Route definitions and protected routing (requires authenticated user) (`frontend/src/App.jsx:1`).
- `frontend/src/context/AuthContext.jsx`: Auth state (user/token), login/logout, fetch current user via `/api/auth/me` (`frontend/src/context/AuthContext.jsx:5`).
- `frontend/src/context/CalendarContext.jsx`: Calendar/event data loading and share actions, plus per-calendar color persistence (`frontend/src/context/CalendarContext.jsx:6`).
- `frontend/src/components/Layout/Layout.jsx`: Main shell UI (sidebar, header), notification dropdown behavior, quick actions (`frontend/src/components/Layout/Layout.jsx:22`).
- `frontend/src/pages/*`: Top-level route pages (Dashboard, Calendar, Tasks, Settings, Login, Register).
- `frontend/src/components/Calendar/*`: Calendar views (Day/Week/Month/Year).
- `frontend/src/components/Modals/*`: UI modals for calendar creation, sharing, and event creation.
- `frontend/vite.config.js`: Dev server proxy so `/api/*` calls reach the backend (`frontend/vite.config.js:7`).
- `frontend/tests/colorUtils.test.js`: Small Node-based test script for palette generation and event layout math.

### Relationships Between Major Modules

- **Frontend contexts** are the primary data layer:
  - `AuthContext` owns `token` and `user`, and is used by `CalendarContext` to call protected APIs.
  - `CalendarContext` wraps the app and exposes calendar/event operations used by pages and modals.
- **Backend routing** follows a “routes → controllers → models” pattern:
  - Express routes mount under `/api/*` (`backend/src/server.js:19`).
  - Controllers implement access checks and database reads/writes.
  - Mongoose models define data schema and persistence.

---

## 3. Architecture

### System Architecture Diagram (Described)

```text
┌───────────────────────────────┐
│            Browser            │
│  React (Vite) UI + Contexts   │
└───────────────┬───────────────┘
                │ HTTP (JSON)
                │ Authorization: Bearer <JWT>
                v
┌───────────────────────────────┐
│        Node.js / Express       │
│  Routes → Controllers → Models │
│  + Reminder Job (cron)         │
└───────────────┬───────────────┘
                │ Mongoose
                v
┌───────────────────────────────┐
│           MongoDB              │
│  Users, Calendars, Events, ... │
└───────────────────────────────┘
                │ SMTP (optional)
                v
┌───────────────────────────────┐
│         Email Provider         │
│  SMTP creds or Ethereal test   │
└───────────────────────────────┘
```

### Component Breakdown (Responsibilities)

**Frontend**

- `AuthContext`: Stores JWT in local storage, fetches current user, handles logout on auth failures (`frontend/src/context/AuthContext.jsx:10`).
- `CalendarContext`: Fetches owned calendars, shared calendars, events; creates calendars/events; sends share invites (`frontend/src/context/CalendarContext.jsx:119`).
- Pages:
  - `Dashboard`: “Today” schedule + invite acceptance/decline + recent activity feed (`frontend/src/pages/Dashboard.jsx:55`).
  - `CalendarPage`: Multi-view calendar with event aggregation across calendars (`frontend/src/pages/CalendarPage.jsx:21`).
  - `TasksPage`: CRUD for tasks (optimistic completion toggle) (`frontend/src/pages/TasksPage.jsx:32`).
  - `SettingsPage`: Displays user profile read-only (`frontend/src/pages/SettingsPage.jsx:1`).
  - `Login` / `Register`: Auth flows and password reset UI (`frontend/src/pages/Login.jsx:1`).
- Layout:
  - Sidebar navigation and calendar lists.
  - Notification dropdown with polling and actions (`frontend/src/components/Layout/Layout.jsx:68`).

**Backend**

- `server.js`: Mounts API routes and starts reminder job (`backend/src/server.js:19`).
- `authMiddleware.protect`: Validates JWT and populates `req.user` (`backend/src/middleware/authMiddleware.js:4`).
- Controllers:
  - `authController`: Register/login/me + password reset workflow (`backend/src/controllers/authController.js:18`).
  - `calendarController`: Owned calendar CRUD + “Personal” default calendar enforcement (`backend/src/controllers/calendarController.js:7`).
  - `eventController`: Events CRUD with shared-calendar access rules + event creation notifications/emails (`backend/src/controllers/eventController.js:29`).
  - `shareController`: Share invites, get shares, accept/decline invites, remove shares (`backend/src/controllers/shareController.js:8`).
  - `taskController`: Task CRUD + activity log on completion (`backend/src/controllers/taskController.js:12`).
  - `notificationController`: Notification CRUD (`backend/src/controllers/notificationController.js:3`).
  - `activityController`: Recent activity feed (`backend/src/controllers/activityController.js:3`).
- Jobs:
  - `reminderJob`: Runs every minute and creates reminder notifications (`backend/src/jobs/reminderJob.js:7`).

### Data Flow & Communication Patterns

- **Authentication**
  - Frontend logs in or registers.
  - Backend returns a JWT.
  - Frontend stores JWT in `localStorage` and attaches it via `Authorization: Bearer <token>` on protected calls.
  - Frontend uses `/api/auth/me` to validate the token and load user data (`frontend/src/context/AuthContext.jsx:16`).
- **Calendar & events**
  - Frontend loads calendars (`/api/calendars`) and shared calendars (`/api/shares`).
  - For a given calendar, frontend fetches events (`/api/calendars/:calendarId/events`).
  - Calendar view aggregates events across all selected calendars in memory.
- **Sharing**
  - Calendar owner sends invite via `/api/shares` with role and email.
  - Recipient sees pending invites via `/api/shares/invites` and accepts/declines.
- **Notifications**
  - Layout polls `/api/notifications` every 60 seconds, displays unread count, allows mark-as-read/delete/clear.
- **Reminders**
  - Backend reminder job checks for upcoming events and creates notification entries.

### Technology Stack

- **Frontend**: React, React Router, Vite, Tailwind CSS, date-fns, lucide-react.
- **Backend**: Node.js, Express, Mongoose, JWT (jsonwebtoken), node-cron, Nodemailer.
- **Database**: MongoDB.

---

## 4. Functionality Details

### 4.1 Authentication

#### Register

- **Endpoint**: `POST /api/auth/register` (`backend/src/routes/authRoutes.js:12`)
- **Body**
  - `name` (string, required)
  - `email` (string, required)
  - `password` (string, required)
- **Behavior**
  - Creates a user.
  - Creates a default calendar named `Personal` marked as `isDefault`.
  - Converts any `PendingShare` invites for that email into accepted calendar shares (`backend/src/controllers/authController.js:65`).
- **Response (200/201)**
  - `_id`, `name`, `email`, `token`

#### Login

- **Endpoint**: `POST /api/auth/login` (`backend/src/routes/authRoutes.js:13`)
- **Body**
  - `email` (string, required)
  - `password` (string, required)
- **Response**
  - `_id`, `name`, `email`, `token`

#### Current User

- **Endpoint**: `GET /api/auth/me` (`backend/src/routes/authRoutes.js:16`)
- **Auth**: `Authorization: Bearer <JWT>`
- **Response**
  - User object (password excluded)

#### Password Reset

- **Request reset email**
  - `POST /api/auth/forgot-password` (`backend/src/routes/authRoutes.js:14`)
  - Body: `email`
  - Generates a short-lived token hash stored on user (15 minutes).
  - Sends a link pointing to the frontend login page with query parameters (`backend/src/controllers/authController.js:147`).
- **Reset password**
  - `POST /api/auth/reset-password` (`backend/src/routes/authRoutes.js:15`)
  - Body: `token` (raw token), `password` (new password)
  - Validates token hash + expiry, then sets new password.

### 4.2 Calendars

#### List calendars (owned)

- **Endpoint**: `GET /api/calendars` (`backend/src/routes/calendarRoutes.js:18`)
- **Auth**: required
- **Response**
  - Array of `Calendar` documents for the logged-in user.
- **Notes**
  - If no default calendar exists, the API enforces/creates a `Personal` calendar and marks it default (`backend/src/controllers/calendarController.js:10`).

#### Create calendar

- **Endpoint**: `POST /api/calendars` (`backend/src/routes/calendarRoutes.js:18`)
- **Body**
  - `name` (string, required)
  - `color` (string, optional)
  - `isDefault` (boolean, optional)
- **Response**
  - Created calendar document.

#### Update calendar

- **Endpoint**: `PATCH /api/calendars/:id` (`backend/src/routes/calendarRoutes.js:19`)
- **Behavior**
  - Only the calendar owner can update.

#### Delete calendar

- **Endpoint**: `DELETE /api/calendars/:id` (`backend/src/routes/calendarRoutes.js:19`)
- **Behavior**
  - Only the calendar owner can delete.
  - Default calendar deletion is blocked unless `?allowDefaultDelete=true` (`backend/src/controllers/calendarController.js:118`).

### 4.3 Events

#### List events for calendar

- **Endpoint**: `GET /api/calendars/:calendarId/events` (`backend/src/routes/eventRoutes.js:12`)
- **Auth**: required
- **Access rules**
  - Owner: allowed.
  - Shared user: must have an accepted share (viewer/editor) (`backend/src/controllers/eventController.js:9`).

#### Create event

- **Endpoint**: `POST /api/calendars/:calendarId/events` (`backend/src/routes/eventRoutes.js:12`)
- **Access rules**
  - Owner: allowed.
  - Shared editor: allowed.
  - Shared viewer: denied (`backend/src/controllers/eventController.js:56`).
- **Body**
  - `title` (string, required)
  - `start` (date, required)
  - `end` (date, required)
  - `description` (string, optional)
  - `location` (string, optional)
  - `allDay` (boolean, optional)
  - `recurrence` (string, optional)
  - `reminders` (array, optional): `[{ time: number, sent?: boolean }]`
  - `participants` (array, optional): list of email strings
- **Side effects**
  - Creates activity + notification entries for owner + accepted share users (`backend/src/controllers/eventController.js:88`).
  - Sends email notifications to the creator and accepted share users (`backend/src/controllers/eventController.js:116`).

#### Get event by ID

- **Endpoint**: `GET /api/events/:id` (`backend/src/routes/eventRoutes.js:17`)
- **Auth**: required
- **Notes**
  - Implemented inline in the router and currently does not apply calendar share permission checks beyond “logged in”.

#### Update event

- **Endpoint**: `PATCH /api/events/:id` (`backend/src/routes/eventRoutes.js:17`)
- **Access rules**
  - Owner or accepted editor can update (`backend/src/controllers/eventController.js:166`).
- **Response**
  - Updated event document.

#### Delete event

- **Endpoint**: `DELETE /api/events/:id` (`backend/src/routes/eventRoutes.js:17`)
- **Access rules**
  - Owner can delete.
  - Event creator can delete if shared and editor.
  - Shared editors who did not create the event are blocked from deletion (`backend/src/controllers/eventController.js:215`).

### 4.4 Sharing & Invites

#### Share a calendar (send invite)

- **Endpoint**: `POST /api/shares` (`backend/src/server.js:25`)
- **Body**
  - `calendarId` (string, required)
  - `email` (string, required)
  - `role` (`viewer` | `editor`, optional)
- **Behavior** (`backend/src/controllers/shareController.js:11`)
  - Only the calendar owner can share.
  - If `email` belongs to an existing user:
    - Creates a `CalendarShare` in `pending` status.
    - Creates an in-app notification for the recipient.
  - If `email` is not registered:
    - Creates a `PendingShare` record and sends an email invite.
    - The invite URL is currently hard-coded in the controller.

#### Get calendars shared with me (accepted)

- **Endpoint**: `GET /api/shares` (`backend/src/routes/shareRoutes.js:20`)
- **Response**
  - Array of `CalendarShare` documents (accepted only), populated with calendar and owner info.

#### Get my pending invites

- **Endpoint**: `GET /api/shares/invites` (`backend/src/routes/shareRoutes.js:17`)
- **Response**
  - Array of `CalendarShare` invites with `status: pending`.

#### Accept/decline invite

- **Endpoint**: `PATCH /api/shares/invites/:id` (`backend/src/routes/shareRoutes.js:18`)
- **Body**
  - `status`: `accepted` or `declined`
- **Behavior**
  - If accepted, updates share status to `accepted`.
  - If declined, deletes the share record.

#### Remove share

- **Endpoint**: `DELETE /api/shares/:shareId` (`backend/src/routes/shareRoutes.js:21`)
- **Behavior**
  - Allowed for the calendar owner or the share recipient.

### 4.5 Tasks

- **List**: `GET /api/tasks` (`backend/src/routes/taskRoutes.js:11`)
- **Create**: `POST /api/tasks` (body: `text`) (`backend/src/controllers/taskController.js:15`)
- **Update**: `PATCH /api/tasks/:id` (body: any task fields, commonly `completed`) (`backend/src/controllers/taskController.js:31`)
  - If completion toggles from false → true, logs activity (`backend/src/controllers/taskController.js:49`).
- **Delete**: `DELETE /api/tasks/:id`

### 4.6 Notifications

- **List**: `GET /api/notifications` (`backend/src/routes/notificationRoutes.js:11`)
- **Mark as read**: `PATCH /api/notifications/:id/read` (`backend/src/routes/notificationRoutes.js:12`)
- **Delete one**: `DELETE /api/notifications/:id` (`backend/src/routes/notificationRoutes.js:13`)
- **Clear all**: `DELETE /api/notifications` (`backend/src/routes/notificationRoutes.js:14`)

### 4.7 Activity Feed

- **Endpoint**: `GET /api/activity` (`backend/src/routes/activityRoutes.js:6`)
- **Behavior**
  - Returns up to 20 activity entries from the last 48 hours.
  - Filters out `target === 'Calendar'` and strips Mongo-like IDs from `details` (`backend/src/controllers/activityController.js:15`).

### 4.8 Background Reminders

- **Schedule**: every minute (`backend/src/jobs/reminderJob.js:7`)
- **Behavior**
  - Looks for events in the next 24 hours with unsent reminders.
  - When reminder time has passed, creates a notification and marks reminder as sent.
- **Current limitation**
  - Reminder notifications are created only for the calendar owner (`backend/src/jobs/reminderJob.js:31`), not for shared users.

---

## 5. Configuration

### Requirements

- Node.js (current project uses modern tooling; use a recent LTS release)
- MongoDB (local or hosted)
- Optional SMTP credentials for sending real emails

### Backend Environment Variables

Use `backend/.env_example` as a template:

```dotenv
PORT=5000
MONGO_URI=
JWT_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
EMAIL_FROM="CalManage <noreply@calmanage.com>"
```

Key parameters:

- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: secret used to sign JWTs.
- `SMTP_*`: SMTP settings used by Nodemailer; if omitted, Ethereal test email is used.
- `EMAIL_FROM`: default sender name/address.

### Frontend Runtime Configuration

- Dev API calls can be made as:
  - Absolute URLs like `http://localhost:5000/api/...` (used in several places).
  - Relative `/api/...` (supported by Vite dev proxy).
- Vite proxy configuration (`frontend/vite.config.js:7`):
  - Proxies `/api` to `http://localhost:5000`.

### Installation

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### Running Locally

Start backend:

```bash
cd backend
npm run dev
```

Start frontend:

```bash
cd frontend
npm run dev
```

Default ports:

- Backend: `http://localhost:5000`
- Frontend (Vite): typically `http://localhost:5173`

---

## 6. Usage Examples

### 6.1 API Examples (cURL)

Register:

```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Ada\",\"email\":\"ada@example.com\",\"password\":\"pass1234\"}"
```

Login:

```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"ada@example.com\",\"password\":\"pass1234\"}"
```

Get my calendars:

```bash
curl http://localhost:5000/api/calendars ^
  -H "Authorization: Bearer <JWT>"
```

Create an event:

```bash
curl -X POST http://localhost:5000/api/calendars/<CALENDAR_ID>/events ^
  -H "Authorization: Bearer <JWT>" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Design Review\",\"start\":\"2025-12-18T14:00:00.000Z\",\"end\":\"2025-12-18T15:00:00.000Z\",\"description\":\"Sprint 12\"}"
```

Share a calendar:

```bash
curl -X POST http://localhost:5000/api/shares ^
  -H "Authorization: Bearer <JWT>" ^
  -H "Content-Type: application/json" ^
  -d "{\"calendarId\":\"<CALENDAR_ID>\",\"email\":\"friend@example.com\",\"role\":\"viewer\"}"
```

Accept an invite:

```bash
curl -X PATCH http://localhost:5000/api/shares/invites/<INVITE_ID> ^
  -H "Authorization: Bearer <JWT>" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"accepted\"}"
```

### 6.2 Frontend Usage Patterns (Code Snippets)

Accessing auth state in a component:

```jsx
import { useAuth } from './context/AuthContext';

export function ProfileChip() {
  const { user, logout } = useAuth();
  return (
    <button onClick={logout}>
      {user?.name} ({user?.email})
    </button>
  );
}
```

Creating an event from UI (simplified):

```jsx
import { useCalendar } from './context/CalendarContext';

export function QuickCreate({ calendarId }) {
  const { addEvent } = useCalendar();
  const create = async () => {
    await addEvent(calendarId, {
      title: 'Standup',
      start: new Date(),
      end: new Date(Date.now() + 30 * 60 * 1000),
    });
  };
  return <button onClick={create}>Create</button>;
}
```

---

## 7. Testing

### Methodology

- Frontend includes a lightweight Node-based test script (no test runner dependency).
- Tests validate:
  - HSL-to-hex conversion uniqueness for calendar palette generation.
  - Time-to-UI-rectangle math for event layout.

### Test Cases & Coverage

- `frontend/tests/colorUtils.test.js`:
  - Generates 24 colors and asserts uniqueness.
  - Computes a basic “event rectangle” for a 4-hour event and asserts expected ranges.

### Running Tests

From `frontend/`:

```bash
npm test
```

Linting:

```bash
npm run lint
```

Backend tests are not currently included.

---

## 8. Deployment

### Build Process

Frontend build:

```bash
cd frontend
npm run build
```

Build output:

- `frontend/dist/` (static assets)

Backend:

- No compile/build step; run with Node.js.

### Deployment Instructions (Typical)

- **Deploy MongoDB**: Ensure a reachable `MONGO_URI` for the backend.
- **Deploy backend**
  - Set environment variables (see `backend/.env_example`).
  - Run `npm install` then `npm start` in `backend/`.
  - Use a process manager (e.g., systemd/PM2) in production.
- **Deploy frontend**
  - Build `frontend/dist/`.
  - Serve static files via a CDN or web server (Nginx/Apache/Cloud hosting).
  - Configure your frontend to call the backend (either via relative `/api` behind a reverse proxy or absolute backend URL).

### Environment-Specific Considerations

- **CORS**: Backend enables CORS globally (`backend/src/server.js:14`). If deploying with stricter origins, restrict CORS to your frontend domain.
- **Password reset and invite links**: URLs are hard-coded in controllers and should be updated for your deployed domains (`backend/src/controllers/authController.js:147`, `backend/src/controllers/shareController.js:78`).
- **Reminder job**: Runs in-process with the API server. If you scale to multiple backend instances, the reminder job will run on each instance unless separated.

---

## 9. Maintenance

### Troubleshooting Guide

- **Frontend can’t reach backend**
  - Ensure backend is running on `http://localhost:5000`.
  - If using relative `/api` calls, ensure `frontend/vite.config.js` proxy is active in dev.
- **401 Not authorized**
  - Token missing/expired; sign in again.
  - Verify `JWT_SECRET` matches the secret used when tokens were issued.
- **Mongo connection fails**
  - Confirm `MONGO_URI` is set and reachable.
  - Check logs from `backend/src/config/db.js:4`.
- **Emails not sending**
  - Without SMTP env vars, the app uses Ethereal test accounts and prints preview URLs (`backend/src/utils/emailService.js:22`).
  - With SMTP, verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_SECURE`.
- **Invite acceptance doesn’t show calendar immediately**
  - Dashboard currently uses a full page refresh after accepting invites (`frontend/src/pages/Dashboard.jsx:155`).

### Common Issues & Solutions

- **Mixed API base URLs**
  - Some frontend calls use `http://localhost:5000/...` and others use `/api/...`.
  - Standardize on one approach for easier environment configuration.
- **Notification linking**
  - The notification schema uses `relatedId`; ensure controllers write to the correct field if you want consistent linking (`backend/src/models/Notification.js:21`).

### Future Enhancement Roadmap

- Add backend test suite (unit + integration) and CI workflow.
- Consolidate frontend API layer (single base URL, shared fetch helpers).
- Expand reminder delivery to shared calendar users and/or email reminders.
- Improve event querying (range-based endpoints to avoid “fetch all events” patterns).
- Add event editing/deleting in UI and richer recurrence support.
- Add role-aware UI behavior (e.g., hide creation options on viewer calendars).

