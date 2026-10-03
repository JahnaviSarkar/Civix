# CIVIX — Smart Waste Management Platform

Hi, I'm Jahnavi — I built CIVIX as a full-stack project to explore how a role-based civic platform could connect citizens, sanitation crews, and municipal admins around a single shared workflow: reporting a problem, routing it to the right person, and verifying it actually got fixed.

It's a cloud-based municipal governance web app for urban waste monitoring, citizen reporting, crew task routing, and AI-assisted severity scoring — with three dedicated portals, each built around what that specific role actually needs to do.

**Connect with me:** [LinkedIn](your-linkedin-url-here)

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
