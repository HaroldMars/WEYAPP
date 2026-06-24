# Hearth — Real-Time Chat App

A full-stack, real-time chat application:

- **Frontend**: React + Vite (JSX), Tailwind CSS, Socket.IO client, React Router
- **Backend**: Node.js + Express, Socket.IO, MongoDB (Mongoose), JWT auth, Nodemailer

The frontend and backend are two **independent** projects (`client/` and `server/`) connected only
by a REST API + WebSocket contract. You can deploy them separately (e.g. client on Vercel, server
on Render/Railway) or run them together on one VPS.

## Features

- Sign up, log in, log out
- Email verification on signup (real email via Gmail SMTP, or console-logged in dev if unconfigured)
- Forgot password / reset password via emailed link
- Add other users and start 1:1 conversations
- Real-time messaging (Socket.IO) — text + image messages
- Typing indicators, online/offline presence, "last seen"
- Profile page: avatar upload, phone number, bio
- Settings page: log out

## Project structure

```
chatapp/
├── client/          React frontend (Vite)
│   ├── src/
│   │   ├── api/         API call wrappers (axios) — one file per backend resource
│   │   ├── context/     AuthContext, SocketContext (global state)
│   │   ├── hooks/        useConversations, useMessages (data + real-time logic)
│   │   ├── components/  Reusable UI building blocks
│   │   ├── pages/        Route-level screens
│   │   └── utils/        Formatting helpers
│   └── .env             VITE_API_URL — where your backend lives
│
└── server/          Express backend
    ├── src/
    │   ├── config/       DB + Cloudinary setup
    │   ├── models/       Mongoose schemas: User, Conversation, Message
    │   ├── controllers/  Route handler logic
    │   ├── routes/        Express routers
    │   ├── middleware/   Auth guard, file upload handling
    │   ├── sockets/       Socket.IO real-time event handlers
    │   └── utils/         JWT helpers, email sending, demo data seeder
    └── .env             All secrets and config (DB, JWT, email, uploads)
```

## Why this is "recyclable"

The client never talks to MongoDB or Express internals directly — it only calls a documented REST
API (`/api/auth/...`, `/api/users/...`, `/api/conversations/...`) and listens to a fixed set of
Socket.IO events (`message:new`, `user:online`, etc). That means:

- You can swap the backend for a different language/framework as long as it implements the same
  routes and socket events, and the React frontend keeps working unchanged.
- You can swap the frontend for React Native, another framework, or a CLI client, and the Express
  backend keeps working unchanged.
- Every API call lives in `client/src/api/*.js` — if a route ever changes, you only edit it in one
  place.

## Local development

### 1. Backend

```bash
cd server
cp .env.example .env     # edit values (see below)
npm install
npm run dev               # starts on http://localhost:5000 with nodemon auto-reload
```

Required `.env` values to get started:

```env
MONGO_URI=mongodb://localhost:27017/chatapp     # or a MongoDB Atlas connection string
JWT_SECRET=any-long-random-string
CLIENT_URL=http://localhost:5173
```

You need a MongoDB instance — either install MongoDB locally, or get a free cluster at
[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and paste its connection string into
`MONGO_URI`.

**Email is optional for local dev.** If `EMAIL_USER`/`EMAIL_PASS` are left blank, verification and
password-reset emails are printed to the server console instead of sent — copy the link from the
terminal to test the flow. To send real emails, see "Setting up Gmail SMTP" below.

**Optional: seed demo users** (pre-verified, so you can skip email verification while testing):

```bash
npm run seed
# creates alice@demo.com / bob@demo.com / carla@demo.com, all with password: password123
```

### 2. Frontend

```bash
cd client
cp .env.example .env     # edit VITE_API_URL if your backend isn't on localhost:5000
npm install
npm run dev                # starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser. Sign up, check your server's terminal for the
verification link (if email isn't configured), click it, then log in.

## Setting up Gmail SMTP (for real emails)

1. Turn on 2-Step Verification on your Google account.
2. Go to https://myaccount.google.com/apppasswords and create an "App Password" for "Mail".
3. In `server/.env`:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=youraddress@gmail.com
   EMAIL_PASS=the16characterapppassword
   EMAIL_FROM="Hearth <youraddress@gmail.com>"
   ```
4. Restart the server. Verification/reset emails will now actually be delivered.

(Any Nodemailer-supported SMTP provider works too — Resend, SendGrid, Mailgun, etc. Just change
`EMAIL_SERVICE` or set custom SMTP host/port if you go that route.)

## Deploying

### Backend (Render, Railway, Fly.io, or any VPS)

1. Push the `server/` folder to its own Git repo (or a subfolder of a monorepo).
2. Set the following environment variables on your host:
   - `MONGO_URI` — use MongoDB Atlas in production (don't run Mongo on the same free-tier box)
   - `JWT_SECRET` — generate a new long random string for production, don't reuse the dev one
   - `CLIENT_URL` — your deployed frontend's URL (e.g. `https://yourapp.vercel.app`)
   - `NODE_ENV=production`
   - `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
   - `UPLOAD_STRATEGY=cloudinary` plus `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
     `CLOUDINARY_API_SECRET` — **important**: most hosts (Render, Railway free tiers) wipe local
     disk on every redeploy, so uploaded avatars/images would be lost. Cloudinary has a free tier
     and keeps files persistent. If you're on a real VPS with persistent disk, `UPLOAD_STRATEGY=local`
     is fine.
3. Build command: `npm install`. Start command: `npm start`.
4. A ready-made `render.yaml` blueprint is included in `server/` if you deploy to Render.

### Frontend (Vercel / Netlify)

1. Push the `client/` folder to its own Git repo (or subfolder).
2. Set the environment variable `VITE_API_URL` to your deployed backend's URL (e.g.
   `https://chatapp-server.onrender.com`), with **no trailing slash**.
3. Build command: `npm run build`. Output directory: `dist`.
4. Deploy.

### After deploying both

Double check `CLIENT_URL` on the backend matches your real frontend URL exactly (protocol +
domain), since it's used for CORS and for building the links inside verification/reset emails. If
they don't match, login will fail with a CORS error and emailed links will point to the wrong
place.

## Notes on the temporary `npm run dev` setup

Right now both `client` and `server` run via `npm run dev` (Vite dev server + nodemon). That's
correct for local development. For production:

- Frontend: `npm run build` produces a static `dist/` folder — that's what you deploy, not
  `npm run dev`.
- Backend: `npm start` (no nodemon, no auto-reload) is the production command.

Both are already wired up in `package.json` — you don't need to change anything when you're ready
to deploy, just use the right command on each host.
