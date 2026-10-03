# CIVIX — Smart Waste Management Platform

Hi, I'm Jahnavi — I built CIVIX as a full-stack project to explore how a role-based civic platform could connect citizens, sanitation crews, and municipal admins around a single shared workflow: reporting a problem, routing it to the right person, and verifying it actually got fixed.

It's a cloud-based municipal governance web app for urban waste monitoring, citizen reporting, crew task routing, and AI-assisted severity scoring — with three dedicated portals, each built around what that specific role actually needs to do.

**Connect with me:** [LinkedIn](https://www.linkedin.com/in/jahnavi-sarkar/)

---

## Features

### Citizen Portal
- Report waste issues with photo upload, auto-detected location, and AI-generated severity scoring
- Track the live status of submitted reports on an interactive GIS map (Leaflet)
- Rate and leave feedback once a report is resolved

### Sanitation Crew Portal
- View assigned cleanup tasks, categorized by urgency
- Mark tasks as started and submit "after" photo proof with notes upon completion
- Receive and act on admin rework feedback for rejected submissions

### Municipal Admin Portal
- Analytics dashboard: resolution rates, average turnaround time, category breakdowns
- Assign reported issues to crew units, with visibility into each crew's current workload
- Two-phase verification: approve a resolved report to close it, or reject with feedback to send it back for rework

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Lucide React icons |
| State & Data Fetching | TanStack React Query |
| Maps & Charts | Leaflet / React-Leaflet, Recharts |
| Backend | Python 3.12, FastAPI |
| Validation | Pydantic v2 |
| Database & Auth | Firebase (Firestore, Auth, Admin SDK) |
| AI / ML | TensorFlow (MobileNetV2) — image-based severity and category scoring |
| Testing | Pytest, Starlette TestClient |

---

## Project Architecture

smart-waste-app/
├── backend/
│ ├── app/
│ │ ├── main.py # FastAPI entrypoint & route registration
│ │ ├── config.py # Environment & settings management
│ │ ├── dependencies/ # Auth & Firebase Admin initialization
│ │ ├── routers/ # API route handlers (citizen, crew, admin)
│ │ ├── services/ # Firestore repository layer
│ │ └── schemas/ # Pydantic request/response models
│ ├── ai_model/ # TensorFlow severity-scoring model
│ └── tests/ # Pytest suite
├── frontend/
│ └── app/
│ ├── src/
│ │ ├── pages/ # LoginPage, CitizenDashboard, CrewDashboard, AdminDashboard
│ │ ├── components/ # Shared UI components
│ │ ├── hooks/ # React Query data hooks
│ │ └── api/ # Typed API client layer
└── firebase/
└── firestore.rules # Firestore security rules


---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.12+
- A Firebase project with Firestore (Native mode) and Authentication enabled

### 1. Clone and install

```bash
git clone <repo-url>
cd smart-waste-app
```

**Backend:**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend/app
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` in the backend directory and fill in your Firebase credentials:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
ENABLE_DEMO_TOKENS=true     # enables one-click role demo access for local testing
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

Alternatively, place a Firebase service account key file at `backend/serviceAccountKey.json` (never commit this file — it's git-ignored by default).

### 3. Run the backend

```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
API available at `http://localhost:8000`, with interactive Swagger docs at `http://localhost:8000/docs`.

### 4. Run the frontend

```bash
cd frontend/app
npm run dev
```
App available at `http://localhost:3000`.

### 5. Try it out

Use the quick role-access buttons on the login screen to instantly explore the Citizen, Crew, and Admin portals without manual signup — ideal for demoing the full report → assign → resolve → verify workflow in one sitting.

---

## Deployment (Vercel)

The frontend is configured for deployment on Vercel via `vercel.json`.

1. Push the repository to GitHub and import it into Vercel.
2. In the Vercel project's environment variables, set:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (ensure newlines are preserved exactly as in the service account key)
   - `ENABLE_DEMO_TOKENS` (set explicitly per environment — defaults to `false` for safety)
   - `CORS_ORIGINS` including your deployed frontend URL
3. Because the backend depends on TensorFlow for AI severity scoring, deploying it as a Vercel serverless function may exceed size/runtime limits. For production, consider hosting the FastAPI backend on a platform suited to longer-running Python processes (e.g. Render, Railway, or a VM), with Vercel serving the frontend and proxying API calls to that backend.

---

## Testing

```bash
cd backend
.\venv\Scripts\python.exe -m pytest
```

Covers authentication, complaint lifecycle, crew assignment, admin verification, and resilience scenarios — 30 tests, all passing.

---

## Security Notes

- `ENABLE_DEMO_TOKENS` is disabled by default and must be explicitly enabled per environment — it exists purely to streamline local development and demos.
- Firestore security rules deny all direct client-side writes; all data mutations are routed through the authenticated FastAPI backend.
- Service account credentials are never committed to version control.

---

## License

This project is available for educational and portfolio purposes.