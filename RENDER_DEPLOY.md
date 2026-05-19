# Deploying this project on Render

This document explains how to deploy the two Node services in this repository to Render: the main backend (`Backend`) and the dummy payment gateway (`Payment gateway`). It also includes an example `render.yaml` you can use for Infrastructure-as-Code.

## Overview
- `Backend`: Express app using MongoDB (Mongoose). Start command: `npm start` (runs `node app.js`).
- `Payment gateway`: Express + Prisma service using PostgreSQL. Start command: `npm start` (runs `node src/index.js`).

Both apps read `process.env.PORT` and are ready for Render's web services.

## Prerequisites
- A Git repository (GitHub recommended) connected to Render.
- A Render account.
- A MongoDB instance (MongoDB Atlas recommended) for the `Backend`.
- A Render PostgreSQL database (or any Postgres) for the `Payment gateway`.

## Environment variables

Backend (`Backend` service) - required env vars:
- `MONGO_URL` — MongoDB connection string (MongoDB Atlas URI).
- `SESSION_SECRET` — session cookie secret.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — if you use Cloudinary for uploads.
- `GMAIL_USER`, `GMAIL_PASS` — mailer credentials (used by `utils/mailer.js`).
- `PAYMENT_URL` — URL of the payment gateway (set to your Render payment service URL, e.g. `https://payment-yourname.onrender.com`).
- `NODE_ENV` — set to `production`.

Payment gateway (`Payment gateway` service) - required env vars:
- `DATABASE_URL` — Postgres connection string (Render PostgreSQL provides this).
- `NODE_ENV` — optional; set to `production`.

Note: Render provides the `PORT` value automatically.

## Deploying the `Backend` service on Render
1. In Render dashboard, create a new **Web Service**.
2. Connect your Git repo and select the branch.
3. Set the **Root Directory** to `Backend`.
4. Build Command: leave blank (dependencies install automatically) or set to `npm install`.
5. Start Command: `npm start` (runs `node app.js`).
6. Add the environment variables listed above in the Render service settings.
7. Deploy. After successful deploy, set the `PAYMENT_URL` env to the payment service URL.

## Deploying the `Payment gateway` service on Render
1. In Render dashboard, create a new **Postgres** database (name it e.g. `payment-db`).
2. Create a new **Web Service**, connect repo and select the branch.
3. Set the **Root Directory** to `Payment gateway`.
4. Build Command: `npm install && npx prisma generate` (ensures Prisma client is generated during build).
5. Start Command: `npm start` (runs `node src/index.js`).
6. Add `DATABASE_URL` in the service's environment variables — copy from the Postgres database dashboard.
7. Deploy.

After the service is up, you must apply the Prisma schema to the DB. There are two options:
- Run `npx prisma db push` from Render's Shell (Dashboard → Service → Shell) once the DB is available.
- Or temporarily set the Build Command to `npm install && npx prisma generate && npx prisma db push` (note: this may fail if DB not yet provisioned during build).

## render.yaml (optional)
Add this `render.yaml` at repo root to declare the two services and the database. Update names, regions and plan as desired.

```yaml
services:
  - type: web
    name: backend
    env: node
    branch: main
    region: oregon
    plan: free
    buildCommand: npm install
    startCommand: npm start
    servicePath: Backend
    envVars:
      - key: MONGO_URL
        fromDatabase: false
      - key: SESSION_SECRET
        fromDatabase: false

  - type: web
    name: payment-gateway
    env: node
    branch: main
    region: oregon
    plan: free
    buildCommand: npm install && npx prisma generate
    startCommand: npm start
    servicePath: "Payment gateway"
    envVars:
      - key: DATABASE_URL
        fromDatabase: false

databases:
  - name: payment-db
    engine: postgres
    plan: standard-0
    region: oregon

# After applying, set any secret values in Render dashboard or use Render's secrets.
```

## Post-deploy checks
- Backend: confirm pages render and login works, check logs for DB connection.
- Payment gateway: POST `/payments` to verify transactions are stored.

## Quick Git commands
```bash
git add RENDER_DEPLOY.md
git commit -m "Add Render deployment instructions"
git push
```

## Notes & troubleshooting
- If Prisma client errors occur, run `npx prisma generate` and `npx prisma db push` using Render Shell.
- If MongoDB connection fails, verify the `MONGO_URL` IP access list in Atlas includes Render's outbound IPs or allow access from anywhere (0.0.0.0/0) while testing.
- Keep secrets out of source control — set them in Render's Environment → Environment Variables (or use Render Secrets).

---

If you want, I can also add a `render.yaml` file to the repo and/or create a minimal `.dockerignore`/Dockerfile adjustments — tell me which option you prefer.
