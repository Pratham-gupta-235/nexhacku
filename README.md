# IntelliSecure — Fraud Detection Frontend + Backend

This repository contains a full-stack prototype for IntelliSecure — an AI-powered fraud detection demo with two types of accounts (Personal/User and Business), a React frontend, and a Python backend for ML prediction.

This README explains how to run the frontend and backend, how authentication and dashboards work, where to configure Firebase, and how to test the main flows.

---

## Table of contents
- Project overview
- Quick start
	- Frontend
	- Backend
	- Firebase setup
- Main features & routes
- Developer notes
- Testing & troubleshooting
- Contributing

---

## Project overview

- Frontend: React + Vite located in `fraudAI_Frontend_React/`.
- Backend: Python FastAPI app located in `AI_model_server_Fastapi/` (virtualenv included). Some frontend code posts to an ML endpoint at `127.0.0.1:5000` — if you run the FastAPI app on a different port update the frontend fetch URLs accordingly.
- Database & Auth: Firebase Firestore + Firebase Authentication (Google Sign-In).

This project demonstrates:
- Dual sign-in flow (Personal/User and Business accounts).
- Separate dashboards for customers and businesses.
- Send-money UI with recipient UPI verification via ML model.
- JSON batch upload and prediction UI (PredictForm).
- Transaction storage in Firestore for analytics.

---

## Quick start

Requirements
- Node.js (16+ recommended) and npm/yarn
- Python 3.10+ (for backend)
- A Firebase project and credentials (See Firebase setup below)

1) Frontend

	- Open a terminal, go to the frontend folder and install dependencies:

	```powershell
	cd "d:\Coding Area\Project2\nexhacku\fraudAI_Frontend_React"
	npm install
	npm run dev
	```

	The Vite dev server runs on a port like `5173` (see terminal output). Open the displayed `localhost` URL.

2) Backend (FastAPI)

	- Activate the provided virtual environment or create your own. Example (PowerShell):

	```powershell
	cd "d:\Coding Area\Project2\nexhacku\AI_model_server_Fastapi"
	.\my_project_env\Scripts\Activate.ps1
	pip install -r requirements.txt   # if you have requirements.txt, otherwise install fastapi, uvicorn, scikit-learn, pandas, numpy
	uvicorn app:app --reload --port 8000
	```

	Note: In code there are a few places calling a prediction endpoint at `http://127.0.0.1:5000/predict` (Flask-style). If you run the FastAPI app on port 8000 either:

	- Update the frontend fetch URLs to `http://127.0.0.1:8000/predict`, or
	- Run a Flask server on port 5000 if that endpoint is required.

3) Firebase

	- Create a Firebase project, enable Authentication (Google) and Firestore database.
	- In the frontend, open `src/components/logic/firebase.js` and replace the config placeholder with your Firebase config object.
	- Ensure you allow appropriate Firestore rules for development (or add the signed-in user's UID checks).

---

## Main features & routes (frontend)

- `/` — Homepage (welcome, sign-in button)
- `/login` — Login page with two sign-in cards (Personal / Business). Sign-in uses Google and saves `accountType` in Firestore (either `user` or `business`).
- `/dashboard` — User (personal) dashboard (shows outgoing transactions and spending analytics).
- `/business-dashboard` — Business dashboard (shows incoming transactions, revenue, customers, charts).
- `/predict` — AI batch prediction UI (JSON upload and results table)
- `/transactions` — Recent / history listing (shows transactions relevant to the signed-in account)

Notes:
- When a user signs in the `users/{uid}` Firestore doc contains an `accountType` field. The dashboards protect each other: business accounts are redirected to `/business-dashboard`, non-business users are redirected to `/dashboard`.

---

## Data model (Firestore)

`users/{uid}`
```json
{
	"uid": "...",
	"name": "...",
	"email": "...",
	"photoURL": "...",
	"upiId": "alice1234@expressbank",
	"accountType": "user" | "business",
	"createdAt": "timestamp",
	"transactionDetails": {...},
	"modelData": {...}
}
```

`transactions/{id}`
```json
{
	"senderUPI": "...",
	"recipientUPI": "...",
	"amount": number,
	"remarks": "...",
	"type": "outgoing",
	"status": "Completed",
	"createdAt": "timestamp"
}
```

---

## How UPI Verification works

1. On the send-money UI the user types a recipient UPI and clicks **Verify**.
2. The app queries `users` collection where `upiId == recipientUpiId`.
3. If a user doc is found it extracts `modelData` (22 numeric features) and posts them to the prediction endpoint.
4. The ML endpoint returns a prediction (fraud vs legitimate). The UI shows one of: Verified (green), Fraudulent (warning), Invalid UPI (not found).

If verification returns fraud, the UI offers a **See Why** action which shows model details saved in the user document.

---

## Development notes & debugging

- If the homepage Verify flow returns `Invalid UPI ID`:
	- Ensure the recipient UPI exists in Firestore `users` collection with the same `upiId` string.
	- Check the console logs in the browser for debug messages printed during verification.
- If the prediction call fails:
	- Confirm the backend prediction server is running and the URL/port match the frontend fetch URL.
	- Check backend logs for errors during prediction.
- Auth issues:
	- Make sure Google Sign-In is enabled in Firebase and OAuth redirect domains include your local development host.

---

## Testing quick checklist

- Sign in as Personal account: Homepage → Sign in → choose Personal → should land on `/dashboard`.
- Sign in as Business account: Homepage → Sign in → choose Business → should land on `/business-dashboard`.
- Verify UPI: Enter an existing user's `upiId` and click Verify → expect a result (Verified/Fraudulent).
- Create a transaction (via TransactionSimulation component) and check Firestore `transactions` collection to confirm storage.

---

## Contributing

PRs are welcome. Small suggestions:
- Keep UI styling consistent (Tailwind and component lib used: shadcn/ui).
- Add tests for important flows if you add backend logic.

## License

Add a license file to the repository (e.g. MIT) or update the following line with your chosen license.

---

If you want, I can also:
- Add a short `requirements.txt` or `package.json` snippets to this README for easier installs.
- Verify and update all frontend fetch URLs to match the backend port you prefer (5000 vs 8000).

Enjoy exploring IntelliSecure! If you want I can open a quick PR to update any ports or create a Docker dev compose for both services.

