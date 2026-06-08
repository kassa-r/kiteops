# KiteOps: Booking System for Kite Schools

## Overview

KiteOps is an rule-based booking and management platform designed for kite schools. It streamlines the coordination of students, instructors, and managers by integrating real-time weather data, Instructor expertise, and automated scheduling logic. The system optimizes lesson allocation, minimizes manual coordination, and enhances the overall booking experience for customers and staff alike.

## Features

- **User Management:** Supports multiple user roles including Manager, Instructor, Customer, and Guest, each with tailored access and functionalities.
- **Instructor & Customer Profiles:** Dedicated profiles to manage personal information, lesson offerings, and booking history.
- **Lesson:** A system to define, manage, and browse available lessons.
- **Booking System:** Facilitates booking of lessons with various statuses (e.g., pending, confirmed, cancelled) and potential conditional checks (e.g., weather-dependent).
- **Secure Authentication:** Integrated user authentication and authorization using Supabase Auth.
- **Role-Based Access Control (RBAC):** Fine-grained access control implemented via Supabase Row-Level Security (RLS).

## Technologies

### Frontend

- **Framework:** Next.js (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Radix UI (components)
- **State Management/Data Fetching:** TanStack Query
- **Form Management:** React Hook Form, Zod (validation)
- **Testing:** Vitest (Unit/Component), Playwright (End-to-End)

### Backend

- **Backend-as-a-Service (BaaS):** Supabase
  - **Database:** PostgreSQL
  - **Authentication:** Supabase Auth
  - **Serverless Functions:** Supabase Edge Functions (Deno runtime)
    - `scheduling-engine` (JWT protected)
    - `manager-settings` (unprotected)

## Architecture

The application follows a modern three-tier architecture:

1.  **Frontend:** The Next.js application provides the user interface and handles all user interactions.
2.  **Service Layer (`app/lib`):** This layer contains TypeScript modules that encapsulate business logic, abstracting direct backend interactions. Frontend components communicate with these services.
3.  **Backend (Supabase):** The core backend infrastructure. This includes:
    - A PostgreSQL database for data storage, extensively secured with Row-Level Security (RLS).
    - Supabase Auth for managing user sessions and permissions.
    - Supabase Edge Functions (written in Deno) for specific server-side logic and API endpoints.

## Setup and Installation

### Prerequisites

- Node.js (LTS version)
- Deno
- Supabase CLI
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SG-Kassandra
```

### 2. Supabase Setup

Initialize Supabase locally and link it to your project.

```bash
supabase init
supabase start
# Follow instructions to link to your Supabase project (if applicable)
# supabase link --project-ref your-project-ref
```

Apply database migrations:

```bash
supabase migration up
```

Seed the database with initial data:

```bash
supabase db seed
```

### 3. Environment Variables

Create a `.env.local` file in the `app/` directory based on `app/.env.example` and fill in your Supabase project credentials.

### 4. Frontend Installation

Navigate to the `app/` directory and install dependencies:

```bash
cd app
npm install
```

## Running the Application

From the `app/` directory:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000` (or the port specified by Next.js).

## Testing

- **Unit & Component Tests:** Run with Vitest.
  ```bash
  cd app
  npm test
  ```
- **End-to-End Tests:** Run with Playwright.
  ```bash
  npm run test:e2e # (or similar command defined in package.json)
  ```
