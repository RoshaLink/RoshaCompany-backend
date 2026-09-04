# RoshaLink Backend API

A robust, modular Node.js + Express + MongoDB REST API built to power the **RoshaLink** platform.

## Features

- 🏗 **Layered Architecture:** Clear separation of concerns (Routes, Controllers, Services, Models, Middlewares, Validations).
- 🗄 **MongoDB & Mongoose:** Schema validation, indexing, and connection management.
- 🛡 **Security & Protection:** Helmet, configurable CORS origins, and Express Rate Limiting.
- 📬 **Lead Capture:** Seamless intake of leads from `ConnectWithUs`, `ContactPage`, `GetStartedModal`, and the Rosha AI chat assistant.
- 📝 **Structured Logging & Global Error Handling:** Consistent JSON responses and clean stack traces.

---

## Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

### 2. Installation

```bash
cd OurOwnWebstieBackend
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

Default variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/roshalink
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4. Running the Server

- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```

- **Production mode:**
  ```bash
  npm start
  ```

The server will start on `http://localhost:5000`.

---

## API Endpoints

### 1. Health Check
- **`GET /api/health`**
- Returns server status and current database connectivity.

### 2. Submit Lead / Inquiry
- **`POST /api/lead`** (or **`POST /api/leads`**)
- **Request Body (JSON):**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Corp",
    "service": "Custom Web Solutions",
    "budget": "$5,000 - $10,000",
    "message": "We would like to redesign our website.",
    "lang": "en",
    "source": "connect-with-us"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Lead received and stored successfully",
    "data": {
      "id": "66ce...",
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Corp",
      "service": "Custom Web Solutions",
      "budget": "$5,000 - $10,000",
      "message": "We would like to redesign our website.",
      "lang": "en",
      "source": "connect-with-us",
      "status": "new",
      "createdAt": "2026-08-29T12:00:00.000Z"
    }
  }
  ```

### 3. List Leads (Internal)
- **`GET /api/leads`**
- Supports pagination query params: `?page=1&limit=20&status=new`.

---

## Project Structure

```
src/
├── config/           # Database & environment variables
├── controllers/      # Route controllers
├── middlewares/      # Error handling, rate limiting, validation
├── models/           # Mongoose schemas
├── routes/           # Express router endpoints
├── services/         # Business logic & DB transactions
├── utils/            # Shared utilities (logger, API response wrapper)
├── validations/      # Request validation schemas
├── app.js            # Express application setup
└── server.js         # Entry point & bootstrap
```

See [AGENTS.md](./AGENTS.md) for full architectural guidelines and agent instructions.
