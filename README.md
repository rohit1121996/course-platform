# Course Platform

A modern, high-performance monorepo platform designed for course hosting and community interaction. It provides a highly interactive forum where students can create posts, leave comments in real-time, and save/bookmark their favorite posts. 

## 🚀 Features

- **Robust Discussion Forum**: Create, like, comment, and save posts effortlessly.
- **Idempotency & Concurrency**: Atomic upserts (`onConflictDoUpdate`) and soft-deletes implemented on the database layer guarantee that concurrent requests (like spam-clicking "Save") are resolved safely without race conditions.
- **Optimistic UI Updates**: The frontend utilizes React Query for snappy, optimistic updates with automatic rollback on network errors.
- **Real-Time Polling**: Comments and posts are synchronized efficiently across clients using React Query's interval polling (`refetchInterval`).
- **Role-Based Access Control (RBAC)**: Users can only see and interact with posts for courses they are enrolled in. A `MODERATOR` role allows system-wide access.
- **Monorepo Architecture**: Clean separation between frontend, backend, and database logic, powered by npm workspaces.

## 🛠️ Tech Stack

- **Frontend (`apps/web`)**: Next.js 15, React 19, React Query v5, Tailwind CSS (optional).
- **Backend (`apps/api`)**: Elysia.js, Bun runtime (Blazing fast REST API).
- **Database (`packages/db`)**: SQLite, Drizzle ORM.
- **Shared (`packages/shared`)**: Shared types and utilities.

## 📂 Project Structure

```text
course-platform/
├── apps/
│   ├── web/        # Next.js App Router frontend
│   └── api/        # Elysia.js + Bun backend API
├── packages/
│   ├── db/         # Drizzle schemas, migrations, and seed scripts
│   └── shared/     # Shared TS interfaces
├── package.json    # Monorepo configuration
└── README.md
```

## 🏁 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- Node.js (v18+)
- [Bun](https://bun.sh/) (Required for the Elysia backend)

### 2. Install Dependencies
From the root of the monorepo, run:
```bash
npm install
```

### 3. Initialize the Database
Push the Drizzle schema to the SQLite database and seed it with mock data (courses, users, and enrollments):
```bash
npm run db:push
npm run db:seed
```

### 4. Start the Application
You'll need to start both the API and Web servers. You can run these in separate terminal tabs:

**Start the Backend API (Elysia.js):**
```bash
npm run dev:api
```
*Runs on `http://localhost:3001`*

**Start the Frontend Web App (Next.js):**
```bash
npm run dev:web
```
*Runs on `http://localhost:3000`*

### 5. Testing (Optional)
Run backend and end-to-end tests:
```bash
npm run test:api
npm run test:e2e
```

## 💡 Architecture & Design Decisions

### Why Soft Deletes for Saved Posts?
Instead of fully deleting a bookmark when a user clicks "Unsave", we update a `deleted_at` timestamp. This preserves historical analytics regarding user behavior (e.g., how often users change their minds) and gracefully resolves race conditions when paired with unique database constraints. 

### Why Polling over WebSockets?
To keep the infrastructure dependency-free and simple for this phase, real-time comment synchronization is achieved through short polling (`refetchInterval: 5000` in React Query). This provides a seamless "real-time" feel while drastically reducing the complexity of setting up and scaling a stateful WebSocket server.
