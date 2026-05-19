# Production Deployment Guide: Multi-Service Architecture on Render

## 1. Architecture Overview

This project consists of two independent Node.js microservices deployed as separate containerized applications. **Render does not support native multi-container `docker-compose` deployments.** Instead, each service must be deployed as an individual Render Web Service pulling from the same Git repository.

**Architecture:**
- **Service A: Main Backend** (Express/EJS application with MongoDB integration)
  - Deployed from `Backend/` directory
  - Listens on port `8080`
  - Handles user authentication, listings, bookings, and reviews
  
- **Service B: Payment Gateway** (Node.js payment processing with Prisma ORM)
  - Deployed from `Payment gateway/` directory
  - Listens on port `5000`
  - Manages payment transactions and database operations
  
Both services communicate via HTTPS with header-based authentication to ensure security.

---

## 2. Dockerfile Configurations

### Backend Service - Production Dockerfile

Create or update `Backend/Dockerfile` with the following optimized configuration:

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app

# Copy only dependency files for better layer caching
COPY package*.json ./

# Install dependencies with production flag
RUN npm ci --only=production

# Runtime stage
FROM node:18-alpine
WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY . .

# Expose port
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Use dumb-init to properly handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "app.js"]
```

**Key optimizations:**
- **Multi-stage build:** Reduces final image size by excluding build dependencies
- **Layer caching:** `package*.json` copied separately to leverage Docker's layer caching
- **`npm ci` instead of `npm install`:** Ensures exact dependency versions from `package-lock.json`
- **Production flag:** Installs only runtime dependencies
- **dumb-init:** Properly handles graceful shutdown signals
- **Environment variable:** Sets `NODE_ENV=production` for Express optimizations

---

### Payment Gateway Service - Production Dockerfile

Create or update `Payment gateway/Dockerfile` with the following configuration:

```dockerfile
# Build stage for Prisma client generation
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for Prisma CLI)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Runtime stage
FROM node:18-alpine
WORKDIR /app

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema
COPY prisma ./prisma/

# Copy application source code
COPY src ./src/
COPY package*.json ./

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Use dumb-init for signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/index.js"]
```

**Key optimizations:**
- **Prisma client generation:** Executed in builder stage to ensure compatibility
- **Separate builder stage:** Reduces runtime image size by ~200MB
- **Multi-stage approach:** Excludes development dependencies (Prisma CLI, build tools)
- **dumb-init:** Ensures proper shutdown handling and Prisma cleanup
- **Schema preservation:** Maintains `prisma/` directory for potential runtime migrations
- **Exact port:** Exposes port `5000` for payment gateway service

---

## 3. Render Deployment Steps

### Prerequisites

1. Push your repository to GitHub (public or private)
2. Create a Render account and link your GitHub repository
3. Set up environment variables (covered in each service section)

---

### Service A: Main Backend

#### Step 1: Create Backend Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **+ New** → select **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name:** `backend-main` (or your preferred name)
   - **Repository:** Select your project repository
   - **Branch:** `main` (or your deployment branch)

#### Step 2: Configure Build Settings

1. **Root Directory:** `Backend`
2. **Environment:** Select **Docker**
3. **Docker Build Context:** `.` (root of repository)
4. **Dockerfile Path:** `Dockerfile`

#### Step 3: Configure Runtime Settings

1. **Instance Type:** Select appropriate tier (Starter, Standard, etc.)
2. **Auto-Deploy:** Enable to auto-deploy on git push

#### Step 4: Set Environment Variables

Click **Environment** and add the following variables:

```
NODE_ENV=production
PORT=8080
MONGO_ATLAS_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
PAYMENT_GATEWAY_URL=https://<payment-gateway-service-url>.onrender.com
SESSION_SECRET=<generate-random-secret-key>
CLOUDINARY_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
MAIL_USER=<your-email>
MAIL_PASS=<your-email-password-or-app-password>
INTERNAL_SECRET=<generate-random-token-for-payment-gateway-auth>
```

**Variable Descriptions:**
- `NODE_ENV`: Ensures Express runs in production mode (compression, caching enabled)
- `PORT`: Must be `8080` (Render binds to this port)
- `MONGO_ATLAS_URL`: MongoDB connection string from MongoDB Atlas
- `PAYMENT_GATEWAY_URL`: Full HTTPS URL of deployed Payment Gateway service
- `SESSION_SECRET`: Random string for session encryption (use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `INTERNAL_SECRET`: Shared token for authenticating Payment Gateway requests (same value on both services)

#### Step 5: Deploy

1. Click **Create Web Service**
2. Render will automatically build and deploy
3. Monitor the deployment in **Logs** tab
4. Once successful, note the service URL: `https://<backend-main>.onrender.com`

---

### Service B: Payment Gateway

#### Step 1: Create Payment Gateway Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **+ New** → select **Web Service**
3. Connect the same GitHub repository
4. Configure the service:
   - **Name:** `payment-gateway` (or your preferred name)
   - **Repository:** Select your project repository
   - **Branch:** `main` (or your deployment branch)

#### Step 2: Configure Build Settings

1. **Root Directory:** `Payment gateway` ← Note: Render handles spaces in directory names
2. **Environment:** Select **Docker**
3. **Docker Build Context:** `.` (root of repository)
4. **Dockerfile Path:** `Dockerfile`

#### Step 3: Configure Runtime Settings

1. **Instance Type:** Select appropriate tier (Starter, Standard, etc.)
2. **Auto-Deploy:** Enable to auto-deploy on git push

#### Step 4: Set Environment Variables

Click **Environment** and add the following variables:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>?schema=public
INTERNAL_SECRET=<same-value-as-backend>
```

**Variable Descriptions:**
- `NODE_ENV`: Ensures production optimizations
- `PORT`: Must be `5000` (Render binds to this port)
- `DATABASE_URL`: Prisma connection string (PostgreSQL, MySQL, or other supported DB)
- `INTERNAL_SECRET`: Must match the Backend's `INTERNAL_SECRET` for authentication

#### Step 5: Deploy

1. Click **Create Web Service**
2. Render automatically builds and deploys
3. Monitor **Logs** for any Prisma migration errors
4. Once successful, note the service URL: `https://<payment-gateway>.onrender.com`

#### Step 6: Update Backend with Payment Gateway URL

After Payment Gateway is deployed:
1. Go back to **Backend** service settings
2. Update the `PAYMENT_GATEWAY_URL` environment variable with the deployed URL
3. Click **Manual Deploy** to redeploy Backend with the correct URL

---

## 4. Database Migrations & Data Seeding

### Backend: MongoDB Data Seeding

**⚠️ CRITICAL WARNING:**

The `Backend/init/index.js` data initialization script is designed to seed sample data. **In production, this script must NOT run automatically on container restarts**, as it will overwrite existing data.

#### Safe Production Approach

1. **Initial Setup (One-Time Only):**
   - Run the initialization locally: `npm run seed` (if configured)
   - Or connect to production MongoDB Atlas and manually run the seed script once

2. **Prevent Auto-Execution on Container Restarts:**
   - Do NOT call `init/index.js` in the application startup sequence
   - Modify `Backend/app.js` to remove any automatic seeding logic
   - Keep the seed script available only for manual execution when needed

3. **Manual Seeding (If Needed):**
   - Connect to production MongoDB directly using MongoDB Compass or CLI
   - Run the seed script with appropriate environment variables
   - Or trigger via a manual admin endpoint (with proper authentication)

---

### Payment Gateway: Prisma Database Migrations

**Automatic Migration on Deployment:**

The Dockerfile includes `npx prisma db push` in the runtime stage, which:
- Automatically applies pending migrations to the database on container startup
- Creates or modifies tables to match `schema.prisma`
- Safe for repeated runs (idempotent)

#### Manual Migration Management

If you need more control over migrations:

1. **Create New Migration:**
   ```bash
   npx prisma migrate dev --name migration_name
   ```
   This creates a migration file in `prisma/migrations/`

2. **Deploy Specific Migration:**
   ```bash
   npx prisma migrate deploy
   ```
   Use this in CI/CD pipelines for deterministic deployments

3. **Reset Database (Development Only):**
   ```bash
   npx prisma migrate reset
   ```
   **WARNING:** Destroys all data. Never use in production.

#### Production Best Practice

- Use `npx prisma migrate deploy` in production deployments instead of `db push`
- This ensures migrations are versioned and trackable
- Update the Dockerfile CMD to:
  ```dockerfile
  CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
  ```

---

## 5. Inter-Service Communication & Security

### Communication Flow

```
Frontend (Browser)
    ↓
Backend Service (Express, port 8080)
    ↓ (HTTPS POST requests)
Payment Gateway Service (port 5000)
    ↓
Prisma ORM
    ↓
Database
```

### Security Middleware: Header-Based Authentication

To prevent unauthorized external access to the Payment Gateway, implement header-based authentication using a shared secret token.

#### Backend: Outgoing Request Middleware

Add this utility to `Backend/utils/paymentClient.js`:

```javascript
import axios from 'axios';

const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL;
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

export const paymentClient = axios.create({
  baseURL: PAYMENT_GATEWAY_URL,
  headers: {
    'x-internal-secret': INTERNAL_SECRET,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Example: Call payment gateway endpoint
export const initiatePayment = async (bookingData) => {
  try {
    const response = await paymentClient.post('/api/payments/initiate', {
      bookingId: bookingData.id,
      amount: bookingData.amount,
      currency: 'INR'
    });
    return response.data;
  } catch (error) {
    console.error('Payment Gateway Error:', error.message);
    throw new Error('Failed to process payment');
  }
};
```

#### Backend: Usage Example

```javascript
import { initiatePayment } from '../utils/paymentClient.js';

// In your booking controller
export const processBooking = async (req, res) => {
  try {
    // ... booking validation logic ...
    
    const paymentData = await initiatePayment({
      id: booking._id,
      amount: booking.totalPrice
    });
    
    // ... handle payment response ...
  } catch (error) {
    // ... error handling ...
  }
};
```

#### Payment Gateway: Request Validation Middleware

Add authentication middleware to `Payment gateway/src/middleware/authMiddleware.js`:

```javascript
const authMiddleware = (req, res, next) => {
  const internalSecret = req.get('x-internal-secret');
  const expectedSecret = process.env.INTERNAL_SECRET;

  if (!internalSecret || internalSecret !== expectedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing internal authentication token'
    });
  }

  next();
};

export default authMiddleware;
```

#### Payment Gateway: Apply Middleware to Protected Routes

```javascript
import express from 'express';
import authMiddleware from './middleware/authMiddleware.js';
import paymentController from './controllers/paymentController.js';

const router = express.Router();

// All payment endpoints require authentication
router.use(authMiddleware);

router.post('/api/payments/initiate', paymentController.initiate);
router.post('/api/payments/confirm', paymentController.confirm);
router.get('/api/payments/:paymentId', paymentController.getStatus);

export default router;
```

### Security Best Practices

1. **HTTPS Only:**
   - Render automatically provides HTTPS for all services
   - Both services communicate exclusively over HTTPS
   - Never transmit sensitive data over HTTP

2. **Environment Variables:**
   - `INTERNAL_SECRET` should be:
     - Strong random string (minimum 32 characters)
     - Generated using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
     - Unique and different from session secrets
     - Rotated periodically in production

3. **Rate Limiting (Optional):**
   Add rate limiting to Payment Gateway routes to prevent brute force attacks:
   ```javascript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     standardHeaders: true,
     legacyHeaders: false,
   });

   router.use(limiter);
   ```

4. **CORS Configuration (Backend):**
   Configure CORS in Backend to restrict requests to known origins:
   ```javascript
   import cors from 'cors';

   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourfrontend.com'],
     credentials: true
   }));
   ```

5. **Request Validation:**
   - Validate all incoming requests using Joi or similar
   - Sanitize and escape user inputs
   - Use HTTPS-only session cookies

6. **Monitoring & Logging:**
   - Log all inter-service communication for audit trails
   - Monitor response times and error rates
   - Set up alerts for failed authentication attempts

---

## Additional Resources

- **Render Documentation:** https://render.com/docs
- **Docker Multi-Stage Builds:** https://docs.docker.com/build/building/multi-stage/
- **MongoDB Atlas:** https://www.mongodb.com/products/platform/atlas
- **Prisma Migrations:** https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate
- **Express Security:** https://expressjs.com/en/advanced/best-practice-security.html

---

**Last Updated:** May 2026
**Version:** 1.0
