# AGENTS.md — Backend Architecture & Guidelines

> **Source of Truth for AI Coding Agents & Developers working on `OurOwnWebstieBackend`.**
> This file outlines the architectural standards, directory structure, coding conventions, and a continuous changelog of completed tasks.
>
> ⚠️ **RULE FOR AGENTS:** Update this file's **Changelog & Task History** section after completing any task or making structural additions!

---

## 1. Project Overview

`OurOwnWebstieBackend` is a standalone, production-ready REST API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**. It serves as the primary backend for the **RoshaLink** web platform (`OurOwnWebsiteFrontend`), handling incoming business inquiries (leads), contact messages, chat-derived briefs, and other backend workflows.

---

## 2. Tech Stack & Dependencies

- **Runtime:** Node.js (ESM - `"type": "module"`)
- **Framework:** Express.js (v4.21+)
- **Database ODM:** Mongoose (v8.9+) with MongoDB
- **Security & Utilities:**
  - `cors`: Configurable CORS origins for local dev and production frontend.
  - `helmet`: Security HTTP response headers.
  - `morgan`: Request logging in development/production.
  - `express-rate-limit`: Rate limiting on public submission endpoints to prevent spam.
  - `dotenv`: Environment variable management.

---

## 3. Directory Architecture

A standard **Modular Layered Architecture (MVC / Service-Oriented)** is enforced. Code must be cleanly separated into distinct single-responsibility directories:

```
OurOwnWebstieBackend/
├── AGENTS.md                        # Agent guide & task history (Must be updated after tasks)
├── README.md                        # Developer onboarding & API reference
├── .env                             # Active environment variables (git-ignored)
├── .env.example                     # Environment template
├── .gitignore                       # Ignored paths
├── package.json                     # Dependencies & scripts
└── src/
    ├── config/                      # Configuration files
    │   ├── db.js                    # MongoDB connection lifecycle & error management
    │   └── env.js                   # Typed and validated environment variables
    ├── controllers/                 # HTTP Request & Response handlers
    │   ├── health.controller.js     # Health check handler
    │   └── lead.controller.js       # Lead creation & retrieval controllers
    ├── models/                      # Mongoose data models & schemas
    │   └── Lead.model.js            # Lead/Contact inquiry schema
    ├── routes/                      # Route definitions & HTTP verbs
    │   ├── index.js                 # Central aggregator under /api
    │   ├── health.routes.js         # /api/health
    │   └── lead.routes.js           # /api/lead & /api/leads
    ├── middlewares/                 # Express middleware layers
    │   ├── error.middleware.js      # Global exception & 404 handler
    │   ├── rateLimiter.middleware.js# IP-based rate limiting
    │   └── validate.middleware.js   # Request validation middleware
    ├── services/                    # Business logic & database operations
    │   └── lead.service.js          # DB queries & external integrations (email notifications)
    ├── validations/                 # Validation schemas & sanity checks
    │   └── lead.validation.js       # Lead payload sanitizer & validator
    ├── utils/                       # Shared helper utilities
    │   ├── apiResponse.js           # Standardized JSON response formatting helper
    │   └── logger.js                # Formatted logger with timestamps & log levels
    ├── app.js                       # Express app configuration & middleware pipeline
    └── server.js                    # Entry point, HTTP server bootstrap & graceful shutdown
```

---

## 4. Architectural Rules & Coding Standards

1. **Layer Separation:**
   - **Routes (`src/routes`)**: Only bind endpoints to middlewares and controller functions. Never put business logic in route files.
   - **Controllers (`src/controllers`)**: Extract request data, call appropriate services, and return responses using `apiResponse.js`.
   - **Services (`src/services`)**: Contain all database queries, domain logic, and external API calls.
   - **Models (`src/models`)**: Define Mongoose schemas with strict types, indexes, and timestamps.
   - **Validations (`src/validations`)**: Validate and sanitize all incoming payload data before controllers execute.

2. **Standard API Response Format:**
   All API endpoints must respond with consistent JSON structures:
   - **Success (2xx):**
     ```json
     {
       "success": true,
       "message": "Human readable message",
       "data": { ... }
     }
     ```
   - **Error (4xx, 5xx):**
     ```json
     {
       "success": false,
       "message": "Error description",
       "errors": [ ... ]
     }
     ```

3. **Error Handling:**
   - Always pass errors to `next(err)` or throw handled errors in async service calls.
   - The central `error.middleware.js` captures all unhandled exceptions and formats them safely without leaking internal stack traces in production.

4. **Backward Compatibility with Frontend:**
   - The frontend calls `/api/lead` with fields `{ name, email, company, service, budget, message, lang, source }`.
   - Both `/api/lead` and `/api/leads` are supported to ensure complete compatibility.

---

## 5. API Endpoints Reference

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/api/health` | Server & DB health check | None |
| `POST` | `/api/auth/login`| Admin authentication with JWT token | 5 req / 15 min per IP |
| `GET` | `/api/auth/me` | Authenticated user profile | None (Protected) |
| `POST` | `/api/lead` | Public lead submission from frontend | 10 req / 15 min per IP |
| `POST` | `/api/leads` | Alias for lead submission | 10 req / 15 min per IP |
| `GET` | `/api/leads` | Retrieve leads list (Requires JWT) | None (Protected) |
| `GET` | `/api/leads/stats`| Lead aggregates & counts (Requires JWT) | None (Protected) |
| `GET` | `/api/leads/:id` | Retrieve single lead detail (Requires JWT)| None (Protected) |
| `PATCH`| `/api/leads/:id/status`| Update lead status (Requires JWT) | None (Protected) |
| `DELETE`| `/api/leads/:id`| Delete an inquiry from MongoDB (Requires JWT)| None (Protected) |

---

## 6. Changelog & Task History

### Task #1: Initial Backend Setup & Lead Capture Integration (2026-08-29)
- Initialized Node.js project with ES modules and standard dependencies.
- Created `AGENTS.md` and `README.md` documentation.
- Built layered architecture (Config, Models, Validations, Middlewares, Services, Controllers, Routes).

### Task #2: Admin Management Endpoints & Aggregation (2026-08-29)
- Added `GET /api/leads/stats` for real-time dashboard analytics.
- Added `PATCH /api/leads/:id/status` for quick status transitions (`new`, `in-progress`, `contacted`, `closed`, `archived`).
- Added `DELETE /api/leads/:id` for lead removal.
- Enhanced `GET /api/leads` with multi-field search and source filtering.

### Task #3: JWT Authentication, Security, Rate Limiting & Admin Seeding (2026-08-29)
- Integrated `bcryptjs` and `jsonwebtoken` for secure password hashing and stateless token verification.
- Added `loginLimiter` with strict 5 attempts per 15 min per IP brute-force protection.
- Created `requireAuth` middleware and secured all lead inspection, modification, and deletion routes.
- Added idempotent automatic database seeder creating 5 admin accounts (`bella`, `milad`, `morteza`, `sohrab`, `mina` with hashed password `letsdoit`).
- Expanded automated test suite with auth and security test coverage (12/12 passing).
