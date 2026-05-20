# Project Documentation: Backend1-Project

## Overview
This repository contains a full-stack application named "Hotspot" with a Node.js/Express backend, a separate Payment Gateway service (Prisma + Express), and Docker compose files to run services together (MongoDB, Postgres, backend, payment-gateway, Prisma Studio).

This document explains the project structure, how the backend works, the payment gateway, and how Docker is used to run everything together. It also includes development and production notes, environment variables, and common commands.

---

## Repository Structure (top-level)
- `Backend/` - Main Express backend (app.js, controllers, models, views, static assets)
- `Payment gateway/` - Separate payment gateway service using Prisma and Express
- `docker-compose.yml` - Orchestrates MongoDB, Postgres, backend, payment-gateway, and Prisma Studio
- Project docs: `PROJECT.md`, `DEPLOYMENT.md`, `RENDER_DEPLOY.md`, `Structure.md`

Detailed `Backend/` tree (important folders):
- `app.js` - Backend entrypoint
- `Controllers/` - Request handlers (user.controller.js, listing.controller.js, booking.controller.js)
- `Routes/` - Express route definitions
- `models/` - Mongoose models (user.model.js, listing.model.js, booking.model.js, review.model.js)
- `utils/` - Helpers (mailer, cloudinary, mailer uses Resend)
- `Middlewares/` - Validation and auth middlewares
- `views/` & `public/` - EJS templates and static frontend assets
- `DB/` and `init/` - DB initialization utilities and seed data

`Payment gateway/` tree (important files):
- `src/index.js` - Payment gateway server entrypoint
- `prisma/schema.prisma` - Prisma schema
- Scripts configured in `package.json` to run Prisma and server

---

## Backend (Backend/)

### Tech stack
- Node.js (ES module style)
- Express 5
- MongoDB with Mongoose
- EJS templating
- Passport.js for authentication
- Cloudinary for uploads
- Resend (email sending library) integrated via `utils/mailer.js`

### How registration/auth works (after OTP removal)
- Registration flow now immediately creates the user and logs them in.
- The `registerUser` controller (in `Controllers/user.controller.js`) validates duplicates, creates a `User` with `isVerified: true`, registers via `passport-local-mongoose`, and logs the user in.
- OTP generation/verification views and routes were removed from the project (no `/verify-otp` or `/resend-otp`).

### Mailer
- `utils/mailer.js` provides a generic `sendEmail({ from, to, subject, html })` function backed by Resend when `RESEND_API_KEY` is present.
- For local development you can still mock or use a test SMTP provider (Mailtrap/Ethereal) by setting appropriate environment variables and adapting `utils/mailer.js` if needed.

### Important files
- `Backend/app.js` — server bootstrap, middleware, view engine, session, passport initialization
- `Backend/.env` — environment variables (see section below)
- `Backend/package.json` — start scripts: `npm run dev` (nodemon) and `npm start` (node app.js).

### Local run (Backend)
From the `Backend` directory:

```bash
npm install
npm run dev    # runs nodemon app.js for development
# or
npm start      # run production-style start
```

Access app at `http://localhost:8080` (when run via Docker, mapped to port 8080).

---

## Payment Gateway (Payment gateway/)

This is a small Express + Prisma service intended to simulate or provide payment processing endpoints.

### Tech stack
- Node.js (CommonJS)
- Express
- Prisma (Postgres)

### Scripts (see `Payment gateway/package.json`)
- `npm run dev` or `npm start` — runs `src/index.js`
- `npm run db:push` — pushes Prisma schema to the DB
- `npm run start:all` — convenience script that runs Docker compose, pushes the DB, and starts the service (as authored)

### Local run (Payment gateway)
From `Payment gateway` folder:

```bash
npm install
npm run db:push   # ensure schema is applied
npm run dev       # start the payment gateway
```

The server listens on port `7000` by default (configured in Docker compose when orchestrated).

---

## Docker / docker-compose

The repository provides a `docker-compose.yml` at the project root to run all core services together for development or simple staging.

Services defined:
- `mongodb` — MongoDB for the backend
- `postgres` — Postgres for the Payment Gateway (Prisma)
- `payment-gateway` — builds from `Payment gateway/` and exposes 7000
- `prisma-studio` — runs `npx prisma db push` then `prisma studio` on port 5555
- `backend` — builds from `Backend/` and exposes 8080

Example: start all services with Docker Compose

```bash
# Run from repository root
docker compose up --build
# or background
docker compose up -d --build
```

Notes:
- Docker compose maps ports on the host: backend:8080, payment-gateway:7000, prisma-studio:5555, mongo:27017, postgres:5432.
- The compose file already provides example environment variables; **do not commit secrets**.

---

## Environment Variables

Place these in `Backend/.env` (or provide them via your orchestration):

- `PORT` — backend port (default 8080)
- `MONGO_URL` — MongoDB connection string
- `SESSION_SECRET` — secret for express-session
- `NODE_ENV` — `development` or `production`
- `SOCKET_PORT` — optional socket port
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary credentials
- `RESEND_API_KEY` — Resend API key (if using Resend for emails)
- `RESEND_FROM` — email "from" address when using Resend
- `PAYMENT_URL` — endpoint URL for the payment gateway (when used externally)

Important: Do not store plaintext credentials in version control. Keep them in environment variables or secret stores.

---

## Notes on Email for Dev vs Production
- For development use Ethereal or Mailtrap to capture and inspect emails without sending to real recipients.
- For production use Resend, SendGrid, Mailgun, Postmark, SES, etc., and verify your sending domain (SPF/DKIM) for deliverability.
- The project currently references `RESEND_API_KEY` and `RESEND_FROM` in `Backend/.env`.

---

## Changes made during maintenance
- OTP verification flow (OTP generation, verification views, and related routes) was removed. Registration now creates and logs in users immediately. Files changed include:
  - `Controllers/user.controller.js` — registration flow simplified
  - `Routes/user.route.js` — `/verify-otp` and `/resend-otp` routes removed
  - `utils/mailer.js` — replaced OTP-specific send with a generic `sendEmail` wrapper
  - `views/users/verify-otp.ejs` — file deleted
  - `public/css/pages/forms.css` — OTP-related styles removed

If you rely on OTP for production verification, re-introduce a dedicated verification flow (email link or OTP) and ensure mail delivery is configured.

---

## Security & Deployment Recommendations
- Replace test credentials with production secrets stored in an appropriate secrets manager.
- Configure domain verification (SPF/DKIM) for your sending domain before sending production email.
- Use TLS/HTTPS in production, secure cookies, and set cookie/session flags appropriately.
- Scale MongoDB and PostgreSQL appropriately (managed services recommended for production).

---

## Quick Troubleshooting
- If backend fails to connect to DB, verify `MONGO_URL` and that `mongodb` service is running (Docker) or that your external cluster is reachable.
- If payments fail, check `Payment gateway` logs and Prisma Studio at `http://localhost:5555` (if running via compose).
- If emails aren't sending, ensure `RESEND_API_KEY` is set or configure a different provider.

---

## Useful Commands Summary

From `Backend/`:
```bash
npm install
npm run dev    # start backend with nodemon
npm start      # production start
```

From `Payment gateway/`:
```bash
npm install
npm run db:push
npm run dev
```

With Docker Compose (project root):
```bash
docker compose up --build
# or
docker compose up -d --build
```

To stop & remove containers:
```bash
docker compose down
```

---

## Next steps / Optional improvements
- Replace hard-coded sample environment values with placeholders and document how to obtain them (Cloudinary, Resend, DB connection strings).
- Add integration tests for registration and payment flows.
- Add CI/CD pipeline for automated deployments (GitHub Actions or similar).
- Re-introduce user email verification via signed links (recommended over short-lived OTPs) if email verification is required for production.

---

If you'd like, I can also:
- Sanitize and move secrets out of `Backend/.env` and add a `.env.example` with placeholders.
- Add Ethereal/Mailtrap dev configuration and update `utils/mailer.js` for a dev fallback.
- Prepare DNS/SPF/DKIM instructions for Resend/SendGrid if you plan production email sending.


---
Generated on: 2026-05-20
