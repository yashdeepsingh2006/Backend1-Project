# Hostly — Project Documentation

## Overview

**Hostly** is a property listing web application (similar to Airbnb) built with Node.js, Express, MongoDB, and EJS.  
It allows users to browse, create, edit, and delete property/accommodation listings.

- **Author:** Om Kamboj
- **App title in browser:** Hotspot
- **Brand name:** Hostly
- **Default Port:** 8080

---

## Tech Stack

| Layer       | Technology                                              |
|-------------|---------------------------------------------------------|
| Runtime     | Node.js (ES Modules — `"type": "module"` in package.json) |
| Framework   | Express.js v5                                           |
| Database    | MongoDB via Mongoose v9                                 |
| Templating  | EJS + ejs-mate (layout/partial support)                 |
| Styling     | Bootstrap 5.3 + Font Awesome 7 + custom CSS             |
| Config      | dotenv                                                  |
| Forms       | method-override (enables PUT/DELETE from HTML forms)    |
| Dev Tool    | nodemon (auto-restart on file changes)                  |

---

## Project Structure

```
Backend/
├── app.js                        # Entry point — Express setup, middleware, routes
├── package.json                  # Project metadata & dependencies
├── .env                          # Environment variables (not committed to git)
│
├── DB/
│   └── db.js                     # MongoDB connection logic using Mongoose
│
├── models/
│   └── listing.model.js          # Mongoose schema & model for a Listing
│
├── Routes/
│   └── listing.route.js          # Route definitions for /listing endpoints
│
├── Controllers/
│   └── listing.controller.js     # Business logic / handler functions for each route
│
├── init/
│   ├── data.js                   # 12 sample listings (seed data)
│   └── index.js                  # Seeder script — run manually to reset & seed DB
│
├── views/
│   ├── layouts/
│   │   └── boilerplate.ejs       # Master HTML layout wrapping every page
│   ├── includes/
│   │   ├── navbar.ejs            # Navigation bar partial
│   │   └── footer.ejs            # Footer partial
│   └── listings/
│       ├── index.ejs             # All listings — card grid view
│       ├── show.ejs              # Single listing detail page
│       ├── new.ejs               # Create new listing form
│       └── edit.ejs              # Edit existing listing form
│
└── public/
    └── css/
        └── style.css             # Custom CSS (Airbnb-inspired card UI)
```

---

## Setup & Running

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Create `.env` File
Create a `.env` file inside `Backend/` with:
```
MONGO_URL=mongodb://127.0.0.1:27017/Hostly
PORT=8080
```
Make sure MongoDB is running locally before starting the app.

### 3. Seed the Database (First-Time / Reset)
```bash
node init/index.js
```
> ⚠️ This **deletes ALL existing listings** and inserts the 12 sample listings fresh. Only run when you want to reset data.

### 4. Start the Server
```bash
npm start          # runs: node app.js
# or for auto-reload during development:
npx nodemon app.js
```

Visit **http://localhost:8080** in your browser.

---

## Routes Reference

All listing routes are prefixed with `/listing` (mounted in `app.js`).

| Method | URL                  | Controller Function  | Description                            |
|--------|----------------------|----------------------|----------------------------------------|
| GET    | `/`                  | inline in app.js     | Root — returns plain text "Root route" |
| GET    | `/listing`           | `getAllListings`      | Shows all listings in a card grid      |
| GET    | `/listing/new`       | `postTheListning`    | Renders the "Create Listing" form      |
| POST   | `/listing`           | `postingNewListing`  | Saves a new listing to MongoDB         |
| GET    | `/listing/:id`       | `getAllListingsById`  | Shows detail page for one listing      |
| GET    | `/listing/:id/edit`  | `editTheListing`     | Renders the "Edit Listing" form        |
| PUT    | `/listing/:id`       | `putTheChanges`      | Updates an existing listing            |
| DELETE | `/listing/:id`       | `deleteTheListing`   | Deletes a listing, redirects to index  |

> **How PUT & DELETE work from HTML forms:**  
> HTML forms only support GET and POST. The `method-override` middleware reads `?_method=PUT` or `?_method=DELETE` appended to the form's action URL and converts the request method accordingly.  
> Example: `<form method="POST" action="/listing/123?_method=DELETE">`

---

## Data Model — Listing

File: `models/listing.model.js`

| Field            | Type   | Required | Rules / Defaults                                           |
|------------------|--------|----------|------------------------------------------------------------|
| `title`          | String | ✅        | max 100 chars, trimmed                                     |
| `description`    | String | ✅        | max 2000 chars, trimmed                                    |
| `image.filename` | String | ❌        | default: `"listingimage"`                                  |
| `image.url`      | String | ❌        | default: Unsplash fallback; empty string also uses default |
| `price`          | Number | ✅        | min 0, max 1,000,000                                       |
| `location`       | String | ✅        | max 100 chars, trimmed                                     |
| `country`        | String | ✅        | max 60 chars, trimmed                                      |
| `createdAt`      | Date   | auto      | Added automatically via `{ timestamps: true }`             |
| `updatedAt`      | Date   | auto      | Added automatically via `{ timestamps: true }`             |

---

## How Templating Works

- **ejs-mate** adds layout support to EJS. Every view starts with:
  ```ejs
  <% layout('/layouts/boilerplate') %>
  ```
- **`boilerplate.ejs`** is the master shell. It includes:
  - Bootstrap 5.3 CSS & JS (from CDN)
  - Font Awesome 7 (from CDN)
  - Custom `style.css` (from `/public/css/`)
  - `navbar.ejs` at the top
  - `footer.ejs` at the bottom
  - `<%- body %>` — where each page's unique content is injected
- Prices are displayed in Indian Rupee format using `toLocaleString("en-IN")`, e.g. ₹1,50,000.

---

## How Form Data is Structured

All form inputs use the `listing[field]` naming convention:
```html
<input name="listing[title]">
<input name="listing[price]">
```
Express parses this (via `express.urlencoded({ extended: true })`) into a nested object:
```js
req.body.listing = { title: "...", price: "...", ... }
```
The controller then passes `req.body.listing` directly to Mongoose.

---

## Middleware Stack (app.js)

| Middleware                              | Purpose                                              |
|-----------------------------------------|------------------------------------------------------|
| `dotenv.config()`                       | Loads `.env` into `process.env`                      |
| `express.urlencoded({ extended: true })` | Parses form POST bodies                             |
| `method-override("_method")`            | Converts POST → PUT/DELETE via `?_method=` query     |
| `ejsMate` as EJS engine                 | Enables layouts and partials in EJS                  |
| `express.static(".../public")`          | Serves CSS and other static files from `/public`     |

---

## Seed Data Summary

`init/data.js` contains 12 sample listings:

| Title                       | Location         | Country        | Price/night |
|-----------------------------|------------------|----------------|-------------|
| Cozy Beachfront Cottage     | Malibu           | United States  | ₹1,500      |
| Modern Loft in Downtown     | New York City    | United States  | ₹1,200      |
| Mountain Retreat            | Aspen            | United States  | ₹1,000      |
| Historic Villa in Tuscany   | Florence         | Italy          | ₹2,500      |
| Secluded Treehouse Getaway  | Portland         | United States  | ₹800        |
| Beachfront Paradise         | Cancun           | Mexico         | ₹2,000      |
| Rustic Cabin by the Lake    | (lake location)  | —              | —           |
| + 5 more...                 |                  |                |             |

---

## Known Issues / Things to Fix

1. **Bug in `putTheChanges` controller:**  
   The update spreads `req.body.getListing` but the form sends data as `req.body.listing`. This means **edits silently do nothing**.  
   Fix: change `req.body.getListing` → `req.body.listing` in `Controllers/listing.controller.js`.

2. **No server-side validation:**  
   Only Mongoose schema constraints run. There are no checks before data reaches the DB, and no user-friendly error messages are shown.

3. **No authentication:**  
   Any visitor can create, edit, or delete any listing.

4. **Silent error handling:**  
   All `catch` blocks only `console.log(err)` — there are no error pages shown to the user.

5. **No pagination:**  
   All listings load on one page regardless of how many exist.

6. **Image URL only:**  
   No file upload support — users must paste an image URL manually.

---

## Navbar Links

| Label             | URL           |
|-------------------|---------------|
| Home              | `/`           |
| All Listings      | `/listing`    |
| Create new listing| `/listing/new`|
